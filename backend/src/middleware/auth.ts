import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export type AuthenticatedRequest = Request & { userId?: string }

const getAccessSecret = (): string | undefined => {
  return process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET
}

export const authenticateAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const accessSecret = getAccessSecret()
  if (!accessSecret) {
    res.status(500).json({ message: 'Access token secret not configured' })
    return
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.slice('Bearer '.length)
  try {
    const payload = jwt.verify(token, accessSecret) as jwt.JwtPayload
    ;(req as AuthenticatedRequest).userId = payload.userId?.toString()
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired access token' })
  }
}
