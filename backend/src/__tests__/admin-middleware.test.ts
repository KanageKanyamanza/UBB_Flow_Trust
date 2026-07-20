import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
  },
}))

import prisma from '../config/prisma.js'
import { isAdminAuthenticated, requireSuperAdmin, type AdminRequest } from '../middleware/admin.middleware.js'
import { ADMIN_FIXTURE, SUPER_ADMIN_FIXTURE, adminToken, expiredAdminToken, userToken } from './helpers.js'

const mockedFindUnique = vi.mocked(prisma.admin.findUnique)

function buildApp() {
  const app = express()
  app.get('/protected', isAdminAuthenticated, (req: AdminRequest, res) => {
    res.json({ admin: req.admin })
  })
  app.get('/super', isAdminAuthenticated, requireSuperAdmin, (_req, res) => {
    res.json({ ok: true })
  })
  return app
}

describe('isAdminAuthenticated', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects requests without a token', async () => {
    const res = await request(buildApp()).get('/protected')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/No token/)
  })

  it('rejects a malformed Authorization header', async () => {
    const res = await request(buildApp()).get('/protected').set('Authorization', 'Basic abc')
    expect(res.status).toBe(401)
  })

  it('rejects an expired token', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${expiredAdminToken()}`)
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Invalid token/)
  })

  it('rejects a token signed with the user app secret', async () => {
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${userToken()}`)
    expect(res.status).toBe(401)
    expect(mockedFindUnique).not.toHaveBeenCalled()
  })

  it('rejects a valid token whose admin no longer exists', async () => {
    mockedFindUnique.mockResolvedValue(null)
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Admin not found/)
  })

  it('attaches the admin and calls next on a valid token', async () => {
    mockedFindUnique.mockResolvedValue(ADMIN_FIXTURE as never)
    const res = await request(buildApp())
      .get('/protected')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(200)
    expect(res.body.admin).toMatchObject({ id: ADMIN_FIXTURE.id, email: ADMIN_FIXTURE.email })
  })
})

describe('requireSuperAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for a regular admin', async () => {
    mockedFindUnique.mockResolvedValue(ADMIN_FIXTURE as never)
    const res = await request(buildApp())
      .get('/super')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/Super admin/)
  })

  it('passes for a super admin', async () => {
    mockedFindUnique.mockResolvedValue(SUPER_ADMIN_FIXTURE as never)
    const res = await request(buildApp())
      .get('/super')
      .set('Authorization', `Bearer ${adminToken(SUPER_ADMIN_FIXTURE.id, SUPER_ADMIN_FIXTURE.email)}`)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
