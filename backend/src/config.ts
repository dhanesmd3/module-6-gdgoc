import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set. Add it to backend/.env (see .env.example).`)
  }
  return value
}

const jwtSecret = required('JWT_SECRET')
if (jwtSecret.length < 32) {
  // A short HMAC secret can be brute-forced offline from any token you hand out.
  throw new Error('JWT_SECRET must be at least 32 characters long.')
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  isProduction: process.env.NODE_ENV === 'production',
  // Origin of the React app. Used for CORS and for redirects after GitHub login.
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  // Public URL of this API. Used to build the GitHub OAuth callback URL.
  apiUrl: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,

  jwtSecret,
  accessTokenTtl: '15m', // Bonus 2 — short-lived access token
  refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000, // Bonus 2 — refresh token lives 7 days
  bcryptRounds: 12,

  // Bonus 1 — optional. "Login with GitHub" returns 501 until these are set.
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
} as const
