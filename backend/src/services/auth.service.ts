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

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isPasswordValid = await this.verifyPassword(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email)

    // Update refresh token in database
    await prisma.user.update({
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
      organization: user.organization,
      accessToken,
      refreshToken,
    }
  }

  static async refresh(token: string) {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET) as unknown as { userId: string; email: string }
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { organization: true },
      })

      if (!user || user.refreshToken !== token) {
        throw new Error('Invalid refresh token')
      }

      const tokens = this.generateTokens(user.id, user.email)

      // Update refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      })

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        organization: user.organization,
        ...tokens,
      }
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  static async listTeamMembers(orgId: string) {
    return await prisma.user.findMany({
      where: { orgId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async createTeamMember(orgId: string, data: {
    email: string
    password?: string
    firstName?: string
    lastName?: string
    role: string
    accountId?: string | null
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existing) {
      throw new Error('User with this email already exists')
    }

    const passwordStr = data.password || 'defaultPassword123'
    const hashedPassword = await this.hashPassword(passwordStr)

    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: data.role as any,
        orgId,
        accountId: data.accountId || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountId: true,
      }
    })
  }

  static async updateTeamMember(id: string, orgId: string, data: {
    role?: string
    accountId?: string | null
    firstName?: string
    lastName?: string
  }) {
    const member = await prisma.user.findFirst({
      where: { id, orgId }
    })
    if (!member) {
      throw new Error('User not found in your organization')
    }

    if (member.role === 'OWNER' && data.role && data.role !== 'OWNER') {
      throw new Error('Cannot change role of the organization owner')
    }

    return await prisma.user.update({
      where: { id },
      data: {
        ...(data.role && { role: data.role as any }),
        accountId: data.accountId !== undefined ? data.accountId : undefined,
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountId: true,
      }
    })
  }

  static async deleteTeamMember(id: string, orgId: string) {
    const member = await prisma.user.findFirst({
      where: { id, orgId }
    })
    if (!member) {
      throw new Error('User not found in your organization')
    }
    if (member.role === 'OWNER') {
      throw new Error('Cannot delete the organization owner')
    }

    return await prisma.user.delete({
      where: { id }
    })
  }
}
