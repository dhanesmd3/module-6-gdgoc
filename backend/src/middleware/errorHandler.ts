import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { AppError } from './AppError'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  // Errors thrown by express.json() (malformed JSON, body too large) carry a 4xx status.
  const status = (err as { status?: unknown })?.status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({ error: 'Invalid request body' })
  }

  // Log the details on the server, but never send stack traces to the client.
  console.error(err)
  return res.status(500).json({ error: 'Internal server error' })
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
}
