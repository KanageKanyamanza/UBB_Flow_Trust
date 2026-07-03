import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

// ── Mock prisma ────────────────────────────────────────────────────────────────
const mockAdmin = {
  id: 'admin-1',
  email: 'admin@test.com',
  firstName: 'Super',
  lastName: 'Admin',
  isSuperAdmin: true,
  password: '$argon2', // placeholder — will be replaced by mock
  refreshToken: null,
}

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn(),
  },
}))

import prisma from '../config/prisma.js'
import argon2 from 'argon2'
import { AdminAuthService } from '../services/admin/admin-auth.service.js'

// ── Tests AdminAuthService ─────────────────────────────────────────────────────
describe('AdminAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('retourne les tokens si les credentials sont valides', async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)
      vi.mocked(argon2.verify).mockResolvedValue(true)
      vi.mocked(prisma.admin.update).mockResolvedValue(mockAdmin as any)

      const result = await AdminAuthService.login('admin@test.com', 'password123')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.admin.email).toBe('admin@test.com')
      expect(result.admin.isSuperAdmin).toBe(true)
    })

    it("lève une erreur si l'admin n'existe pas", async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(null)

      await expect(AdminAuthService.login('unknown@test.com', 'pass')).rejects.toThrow('Invalid credentials')
    })

    it('lève une erreur si le mot de passe est incorrect', async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)
      vi.mocked(argon2.verify).mockResolvedValue(false)

      await expect(AdminAuthService.login('admin@test.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('refresh', () => {
    it('retourne un nouveau accessToken si le refresh token est valide', async () => {
      const { refreshToken } = AdminAuthService.generateTokens('admin-1', 'admin@test.com')

      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ ...mockAdmin, refreshToken } as any)
      vi.mocked(prisma.admin.update).mockResolvedValue(mockAdmin as any)

      const result = await AdminAuthService.refresh(refreshToken)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('lève une erreur si le token est invalide', async () => {
      await expect(AdminAuthService.refresh('invalid.token.here')).rejects.toThrow('Invalid refresh token')
    })

    it('lève une erreur si le token ne correspond pas en DB', async () => {
      const { refreshToken } = AdminAuthService.generateTokens('admin-1', 'admin@test.com')
      vi.mocked(prisma.admin.findUnique).mockResolvedValue({ ...mockAdmin, refreshToken: 'different-token' } as any)

      await expect(AdminAuthService.refresh(refreshToken)).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('logout', () => {
    it('met refreshToken à null en DB', async () => {
      vi.mocked(prisma.admin.update).mockResolvedValue(mockAdmin as any)

      await AdminAuthService.logout('admin-1')

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { refreshToken: null },
      })
    })
  })

  describe('createAdmin', () => {
    it('crée un admin et retourne les données sans mot de passe', async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.admin.create).mockResolvedValue({
        id: 'admin-2',
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'Admin',
        isSuperAdmin: false,
        createdAt: new Date(),
      } as any)

      const result = await AdminAuthService.createAdmin({
        email: 'new@test.com',
        password: 'securePass123',
        firstName: 'New',
        lastName: 'Admin',
      })

      expect(result.email).toBe('new@test.com')
      expect(argon2.hash).toHaveBeenCalledWith('securePass123')
    })

    it("lève une erreur si l'admin existe déjà", async () => {
      vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)

      await expect(
        AdminAuthService.createAdmin({ email: 'admin@test.com', password: 'pass', firstName: 'A', lastName: 'B' })
      ).rejects.toThrow('Admin already exists')
    })
  })
})

// ── Tests middleware isAdminAuthenticated ──────────────────────────────────────
describe('isAdminAuthenticated middleware', () => {
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? 'admin-secret'

  it('appelle next() avec un token valide', async () => {
    const { isAdminAuthenticated } = await import('../middleware/admin.middleware.js')

    const token = jwt.sign({ adminId: 'admin-1', email: 'admin@test.com' }, ADMIN_JWT_SECRET)
    vi.mocked(prisma.admin.findUnique).mockResolvedValue(mockAdmin as any)

    const req = { headers: { authorization: `Bearer ${token}` } } as any
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
    const next = vi.fn()

    await isAdminAuthenticated(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.admin.email).toBe('admin@test.com')
  })

  it('retourne 401 sans token', async () => {
    const { isAdminAuthenticated } = await import('../middleware/admin.middleware.js')

    const req = { headers: {} } as any
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
    const next = vi.fn()

    await isAdminAuthenticated(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('retourne 401 avec un token invalide', async () => {
    const { isAdminAuthenticated } = await import('../middleware/admin.middleware.js')

    const req = { headers: { authorization: 'Bearer invalid.token' } } as any
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
    const next = vi.fn()

    await isAdminAuthenticated(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
  })
})

// ── Tests requireSuperAdmin middleware ─────────────────────────────────────────
describe('requireSuperAdmin middleware', () => {
  it('appelle next() si isSuperAdmin = true', async () => {
    const { requireSuperAdmin } = await import('../middleware/admin.middleware.js')

    const req = { admin: { ...mockAdmin, isSuperAdmin: true } } as any
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
    const next = vi.fn()

    requireSuperAdmin(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('retourne 403 si isSuperAdmin = false', async () => {
    const { requireSuperAdmin } = await import('../middleware/admin.middleware.js')

    const req = { admin: { ...mockAdmin, isSuperAdmin: false } } as any
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
    const next = vi.fn()

    requireSuperAdmin(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
