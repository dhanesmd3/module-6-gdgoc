import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { CookieOptions, Response } from 'express'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../db'
import { refreshTokens } from '../db/schema'
import { config } from '../config'

export const REFRESH_COOKIE = 'refresh_token'

interface AccessTokenPayload {
  userId: number
}

// ---- Access token (JWT, 15 minutes) ----------------------------------------

export function signAccessToken(userId: number): string {
  return jwt.sign({ userId } satisfies AccessTokenPayload, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.accessTokenTtl,
  })
}

// Throws (TokenExpiredError / JsonWebTokenError) if the token is expired,
// tampered with, or signed with a different algorithm.
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
  if (typeof payload === 'string' || typeof payload.userId !== 'number') {
    throw new jwt.JsonWebTokenError('Malformed token payload')
  }
  return { userId: payload.userId }
}

// ---- Refresh token (opaque random string, 7 days) ---------------------------
// The raw token only ever lives in the user's httpOnly cookie. The database
// keeps a SHA-256 hash so it can be looked up and revoked.

const REUSE_GRACE_MS = 30 * 1000

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(48).toString('base64url')
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + config.refreshTokenTtlMs),
  })
  return token
}

// Rotation: every refresh revokes the old token and issues a new one.
// If someone presents a token that was already revoked, it was probably
// stolen and replayed, so we revoke every session of that user.
export async function rotateRefreshToken(
  token: string,
): Promise<{ userId: number; newToken: string } | null> {
  const tokenHash = hashToken(token)
  const existing = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  })

  if (!existing) return null

  if (existing.revokedAt) {
    // Two tabs refreshing at the same moment both send the same token; the
    // loser gets a 401 here but isn't treated as an attack.
    const justRotated = Date.now() - existing.revokedAt.getTime() < REUSE_GRACE_MS
    if (!justRotated) {
      await revokeAllForUser(existing.userId)
    }
    return null
  }

  if (existing.expiresAt <= new Date()) return null

  // Only succeeds once even if two requests race with the same token.
  const [revoked] = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.id, existing.id), isNull(refreshTokens.revokedAt)))
    .returning()

  if (!revoked) return null

  const newToken = await createRefreshToken(existing.userId)
  return { userId: existing.userId, newToken }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, hashToken(token)), isNull(refreshTokens.revokedAt)))
}

async function revokeAllForUser(userId: number): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
}

// ---- Cookie helpers ---------------------------------------------------------

const refreshCookieOptions: CookieOptions = {
  httpOnly: true, // JavaScript (and therefore XSS) can't read it
  secure: config.isProduction, // HTTPS only in production
  sameSite: 'strict', // not sent on cross-site requests (CSRF protection)
  path: '/api/auth', // only sent to the auth endpoints, not every API call
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, { ...refreshCookieOptions, maxAge: config.refreshTokenTtlMs })
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions)
}
