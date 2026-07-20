import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}))

import prisma from '../config/prisma.js'
import adminAuthRouter from '../routes/admin/admin-auth.routes.js'
import { makeApp, ADMIN_FIXTURE, adminToken, refreshToken } from './helpers.js'

const app = makeApp('/api/admin/auth', adminAuthRouter)
const mockedFindUnique = vi.mocked(prisma.admin.findUnique)
const mockedUpdate = vi.mocked(prisma.admin.update)

const PASSWORD = 'S3cure-Pass!'
let dbAdmin: Record<string, unknown>

beforeAll(async () => {
  dbAdmin = { ...ADMIN_FIXTURE, password: await argon2.hash(PASSWORD), refreshToken: null }
})

beforeEach(() => {
  vi.clearAllMocks()
  mockedUpdate.mockResolvedValue(dbAdmin as never)
})

describe('POST /api/admin/auth/login', () => {
  it('returns tokens and the admin profile on valid credentials', async () => {
    mockedFindUnique.mockResolvedValue(dbAdmin as never)

    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: ADMIN_FIXTURE.email, password: PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    expect(res.body.admin).toMatchObject({ id: ADMIN_FIXTURE.id, email: ADMIN_FIXTURE.email })
    expect(res.body.admin.password).toBeUndefined()

    const payload = jwt.verify(res.body.accessToken, process.env.ADMIN_JWT_SECRET!) as { adminId: string }
    expect(payload.adminId).toBe(ADMIN_FIXTURE.id)

    // refresh token must be persisted
    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ADMIN_FIXTURE.id } }),
    )
  })

  it('returns 401 for an unknown email', async () => {
    mockedFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'nobody@trustlane.io', password: PASSWORD })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 401 for a wrong password', async () => {
    mockedFindUnique.mockResolvedValue(dbAdmin as never)
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: ADMIN_FIXTURE.email, password: 'wrong-password' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
    expect(mockedUpdate).not.toHaveBeenCalled()
  })

  it('returns 400 on an invalid email format', async () => {
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'not-an-email', password: PASSWORD })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation error')
  })

  it('returns 400 when the password is missing', async () => {
    const res = await request(app).post('/api/admin/auth/login').send({ email: ADMIN_FIXTURE.email })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/admin/auth/refresh', () => {
  it('rotates tokens for a valid stored refresh token', async () => {
    const token = refreshToken()
    mockedFindUnique.mockResolvedValue({ ...dbAdmin, refreshToken: token } as never)

    const res = await request(app).post('/api/admin/auth/refresh').send({ refreshToken: token })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    expect(mockedUpdate).toHaveBeenCalled()
  })

  it('rejects a refresh token that does not match the stored one (rotation)', async () => {
    mockedFindUnique.mockResolvedValue({ ...dbAdmin, refreshToken: 'another-token' } as never)
    const res = await request(app).post('/api/admin/auth/refresh').send({ refreshToken: refreshToken() })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid refresh token')
  })

  it('rejects a garbage refresh token', async () => {
    const res = await request(app).post('/api/admin/auth/refresh').send({ refreshToken: 'garbage' })
    expect(res.status).toBe(401)
  })

  it('rejects an access token used as a refresh token', async () => {
    const res = await request(app).post('/api/admin/auth/refresh').send({ refreshToken: adminToken() })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/admin/auth/me', () => {
  it('returns the authenticated admin', async () => {
    mockedFindUnique.mockResolvedValue(ADMIN_FIXTURE as never)
    const res = await request(app).get('/api/admin/auth/me').set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: ADMIN_FIXTURE.id, email: ADMIN_FIXTURE.email })
  })

  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/admin/auth/logout', () => {
  it('clears the stored refresh token and returns 204', async () => {
    mockedFindUnique.mockResolvedValue(ADMIN_FIXTURE as never)
    const res = await request(app).post('/api/admin/auth/logout').set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(204)
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: ADMIN_FIXTURE.id },
      data: { refreshToken: null },
    })
  })

  it('requires authentication', async () => {
    const res = await request(app).post('/api/admin/auth/logout')
    expect(res.status).toBe(401)
  })
})
