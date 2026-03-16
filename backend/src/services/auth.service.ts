import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret'
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

export interface RegisterInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  organizationName: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, password)
  }

  static generateTokens(userId: string, email: string) {
    const signOptions: jwt.SignOptions = {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']>,
    }
    const refreshOptions: jwt.SignOptions = {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']>,
    }

    const accessToken = jwt.sign({ userId, email }, JWT_SECRET, signOptions)
    const refreshToken = jwt.sign({ userId, email }, JWT_REFRESH_SECRET, refreshOptions)
    return { accessToken, refreshToken }
  }

  static async register(data: RegisterInput) {
    const { email, password, firstName, lastName, organizationName } = data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const hashedPassword = await this.hashPassword(password)

    // Create organization and user in a transaction
    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName || `${firstName || 'User'}'s Organization`,
        },
      })

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          orgId: organization.id,
          role: 'OWNER',
        },
      })

      const { accessToken, refreshToken } = this.generateTokens(user.id, user.email)

      // Store refresh token
      await tx.user.update({
        where: { id: user.id },
        data: { refreshToken },
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        organization,
        accessToken,
        refreshToken,
      }
    })
  }
}
