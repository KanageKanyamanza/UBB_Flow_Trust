import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    orgId: string
    role: string
  }
}

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' })
    }

    const payload = jwt.verify(token, JWT_SECRET) as unknown as { userId: string; email: string }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, orgId: true, role: true },
    })

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }
}
