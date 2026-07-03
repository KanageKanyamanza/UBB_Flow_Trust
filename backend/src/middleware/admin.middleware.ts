import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret'

export interface AdminRequest extends Request {
  admin?: {
    id: string
    email: string
    firstName: string
    lastName: string
    isSuperAdmin: boolean
  }
}

export const isAdminAuthenticated = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' })
    }

    const token = authHeader.split(' ')[1]!
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as unknown as { adminId: string; email: string }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true, firstName: true, lastName: true, isSuperAdmin: true },
    })

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized: Admin not found' })
    }

    req.admin = admin
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }
}

export const requireSuperAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!req.admin.isSuperAdmin) {
    return res.status(403).json({ error: 'Forbidden: Super admin access required' })
  }
  next()
}
