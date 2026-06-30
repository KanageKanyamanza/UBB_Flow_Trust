import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import prisma from '../../config/prisma.js'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret'
const ADMIN_JWT_REFRESH_SECRET = process.env.ADMIN_JWT_REFRESH_SECRET || 'admin-refresh-secret'
const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

export class AdminAuthService {
  static generateTokens(adminId: string, email: string) {
    const accessToken = jwt.sign(
      { adminId, email },
      ADMIN_JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN } as jwt.SignOptions,
    )
    const refreshToken = jwt.sign(
      { adminId, email },
      ADMIN_JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions,
    )
    return { accessToken, refreshToken }
  }

  static async login(email: string, password: string) {
    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) throw new Error('Invalid credentials')

    const valid = await argon2.verify(admin.password, password)
    if (!valid) throw new Error('Invalid credentials')

    const { accessToken, refreshToken } = this.generateTokens(admin.id, admin.email)

    await prisma.admin.update({
      where: { id: admin.id },
      data: { refreshToken },
    })

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        isSuperAdmin: admin.isSuperAdmin,
      },
    }
  }

  static async refresh(token: string) {
    let payload: { adminId: string; email: string }
    try {
      payload = jwt.verify(token, ADMIN_JWT_REFRESH_SECRET) as { adminId: string; email: string }
    } catch {
      throw new Error('Invalid refresh token')
    }

    const admin = await prisma.admin.findUnique({ where: { id: payload.adminId } })
    if (!admin || admin.refreshToken !== token) throw new Error('Invalid refresh token')

    const { accessToken, refreshToken } = this.generateTokens(admin.id, admin.email)

    await prisma.admin.update({
      where: { id: admin.id },
      data: { refreshToken },
    })

    return { accessToken, refreshToken }
  }

  static async logout(adminId: string) {
    await prisma.admin.update({
      where: { id: adminId },
      data: { refreshToken: null },
    })
  }

  static async createAdmin(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    isSuperAdmin?: boolean
  }) {
    const existing = await prisma.admin.findUnique({ where: { email: data.email } })
    if (existing) throw new Error('Admin already exists')

    const hashed = await argon2.hash(data.password)
    return prisma.admin.create({
      data: {
        email: data.email,
        password: hashed,
        firstName: data.firstName,
        lastName: data.lastName,
        isSuperAdmin: data.isSuperAdmin ?? false,
      },
      select: { id: true, email: true, firstName: true, lastName: true, isSuperAdmin: true, createdAt: true },
    })
  }
}
