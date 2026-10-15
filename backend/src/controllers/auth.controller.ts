import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { config } from '../config'
import { AppError } from '../middleware/AppError'
import { LoginSchema, RegisterSchema, type PublicUser } from '../types/auth'
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  createRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
  signAccessToken,
} from '../utils/tokens'

function toPublicUser(user: { id: number; email: string; name: string }): PublicUser {
  return { id: user.id, email: user.email, name: user.name }
}

// Issues a new session: access token in the JSON body (kept in memory by the
// frontend), refresh token in an httpOnly cookie.
async function startSession(res: Response, user: PublicUser, status: number) {
  const refreshToken = await createRefreshToken(user.id)
  setRefreshCookie(res, refreshToken)
  res.status(status).json({ user, accessToken: signAccessToken(user.id) })
}

// Used when the email doesn't exist, so a login attempt takes about the same
// time either way and response timing doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', config.bcryptRounds)

// POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = RegisterSchema.parse(req.body)

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (existing) {
      return next(new AppError('An account with this email already exists', 409))
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds)
    const [user] = await db.insert(users).values({ name, email, passwordHash }).returning()

    await startSession(res, toPublicUser(user), 201)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = LoginSchema.parse(req.body)

    const user = await db.query.users.findFirst({ where: eq(users.email, email) })
    const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

    // Same message for "no such user" and "wrong password".
    if (!user || !user.passwordHash || !passwordOk) {
      return next(new AppError('Invalid email or password', 401))
    }

    await startSession(res, toPublicUser(user), 200)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/refresh — Bonus 2
// Reads the refresh token cookie, rotates it, and returns a fresh access token.
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token: unknown = req.cookies?.[REFRESH_COOKIE]
    if (typeof token !== 'string') {
      return next(new AppError('No refresh token', 401))
    }

    const rotated = await rotateRefreshToken(token)
    if (!rotated) {
      clearRefreshCookie(res)
      return next(new AppError('Invalid or expired refresh token', 401))
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, rotated.userId) })
    if (!user) {
      clearRefreshCookie(res)
      return next(new AppError('User no longer exists', 401))
    }

    setRefreshCookie(res, rotated.newToken)
    res.status(200).json({ user: toPublicUser(user), accessToken: signAccessToken(user.id) })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token: unknown = req.cookies?.[REFRESH_COOKIE]
    if (typeof token === 'string') {
      await revokeRefreshToken(token)
    }
    clearRefreshCookie(res)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me (protected)
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.userId!) })
    if (!user) {
      return next(new AppError('User not found', 404))
    }
    res.status(200).json(toPublicUser(user))
  } catch (err) {
    next(err)
  }
}

// ---- Bonus 1: Login with GitHub (OAuth 2.0 Authorization Code flow) ---------

const OAUTH_STATE_COOKIE = 'oauth_state'
const githubCallbackUrl = () => `${config.apiUrl}/api/auth/github/callback`

// GET /api/auth/github — step 1: send the browser to GitHub's consent screen.
export function githubStart(_req: Request, res: Response, next: NextFunction) {
  if (!config.githubClientId || !config.githubClientSecret) {
    return next(new AppError('GitHub login is not configured on this server', 501))
  }

  // Random `state` stored in a short-lived cookie. GitHub sends it back and
  // we compare them in the callback, which blocks login CSRF.
  const state = crypto.randomBytes(16).toString('hex')
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax', // must survive the top-level redirect back from github.com
    path: '/api/auth/github',
    maxAge: 10 * 60 * 1000,
  })

  const params = new URLSearchParams({
    client_id: config.githubClientId,
    redirect_uri: githubCallbackUrl(),
    scope: 'read:user user:email',
    state,
  })
  res.redirect(`https://github.com/login/oauth/authorize?${params}`)
}

interface GithubUser {
  id: number
  login: string
  name: string | null
}

interface GithubEmail {
  email: string
  primary: boolean
  verified: boolean
}

// GET /api/auth/github/callback — step 2: GitHub redirects back here with ?code&state.
export async function githubCallback(req: Request, res: Response) {
  const fail = (reason: string) =>
    res.redirect(`${config.frontendUrl}/login?oauth=error&reason=${encodeURIComponent(reason)}`)

  try {
    const { code, state } = req.query
    const expectedState: unknown = req.cookies?.[OAUTH_STATE_COOKIE]
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/api/auth/github' })

    if (typeof code !== 'string' || typeof state !== 'string' || state !== expectedState) {
      return fail('invalid_state')
    }

    // Step 3: exchange the one-time code for a GitHub access token (server-to-server,
    // so the client secret never reaches the browser).
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: githubCallbackUrl(),
      }),
    })
    const tokenBody = (await tokenRes.json()) as { access_token?: string }
    if (!tokenBody.access_token) {
      return fail('token_exchange_failed')
    }

    // Step 4: use that token to read the user's GitHub profile and verified email.
    const ghHeaders = {
      Authorization: `Bearer ${tokenBody.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-api',
    }
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ])
    if (!profileRes.ok || !emailsRes.ok) {
      return fail('github_api_failed')
    }
    const profile = (await profileRes.json()) as GithubUser
    const emails = (await emailsRes.json()) as GithubEmail[]
    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email.toLowerCase()
    if (!primaryEmail) {
      return fail('no_verified_email')
    }

    // Step 5: find or create the local user.
    const githubId = String(profile.id)
    let user = await db.query.users.findFirst({ where: eq(users.githubId, githubId) })

    if (!user) {
      const byEmail = await db.query.users.findFirst({ where: eq(users.email, primaryEmail) })
      if (byEmail) {
        // GitHub verified this email, so it's safe to link it to the existing account.
        ;[user] = await db
          .update(users)
          .set({ githubId })
          .where(eq(users.id, byEmail.id))
          .returning()
      } else {
        ;[user] = await db
          .insert(users)
          .values({ email: primaryEmail, name: profile.name ?? profile.login, githubId })
          .returning()
      }
    }

    // Step 6: start our own session (same as a password login) and send the user
    // back to the frontend, which calls /refresh to get its access token.
    setRefreshCookie(res, await createRefreshToken(user.id))
    res.redirect(`${config.frontendUrl}/login?oauth=success`)
  } catch (err) {
    console.error(err)
    fail('server_error')
  }
}
