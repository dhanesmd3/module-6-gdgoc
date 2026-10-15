import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { verifyAccessToken } from '../utils/tokens'

// Expects the header "Authorization: Bearer <accessToken>".
// On success, sets req.userId for the next handler.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.userId
    next()
  } catch (err) {
    // A separate message lets the frontend know it should call /refresh.
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' })
    }
    res.status(401).json({ error: 'Invalid token' })
  }
}
