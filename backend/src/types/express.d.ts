// Adds `req.userId` to Express' Request type. requireAuth sets it after
// verifying the JWT, so every protected handler knows who is calling.
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export {}
