import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    organization: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    trustScore: { findMany: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock('../services/score-queue.service.js', () => ({
  scoreQueue: { enqueue: vi.fn() },
}))

import prisma from '../config/prisma.js'
import { scoreQueue } from '../services/score-queue.service.js'
import adminTrustRouter from '../routes/admin/admin-trust.routes.js'
import { makeApp, ADMIN_FIXTURE, SUPER_ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/trust', adminTrustRouter)
const mocked = vi.mocked(prisma, true)
const mockedQueue = vi.mocked(scoreQueue, true)

function asAdmin(superAdmin = false) {
  const fixture = superAdmin ? SUPER_ADMIN_FIXTURE : ADMIN_FIXTURE
  mocked.admin.findUnique.mockResolvedValue(fixture as never)
  return adminToken(fixture.id, fixture.email)
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/trust', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/trust')
    expect(res.status).toBe(401)
  })

  it('returns the latest score per org, skipping orgs without scores', async () => {
    const token = asAdmin()
    mocked.organization.findMany.mockResolvedValue([
      { id: 'org-1', name: 'Acme', trustScores: [{ id: 'ts-1', score: 80, reasonCodes: [], createdAt: new Date().toISOString() }] },
      { id: 'org-2', name: 'NoScore', trustScores: [] },
    ] as never)
    mocked.organization.count.mockResolvedValue(2 as never)

    const res = await request(app).get('/api/admin/trust').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0]).toMatchObject({ id: 'ts-1', score: 80, org: { id: 'org-1', name: 'Acme' } })
  })
})

describe('GET /api/admin/trust/:orgId/history', () => {
  it('returns 404 for an unknown org', async () => {
    const token = asAdmin()
    mocked.organization.findUnique.mockResolvedValue(null)
    const res = await request(app).get('/api/admin/trust/missing/history').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('returns the score history of the org', async () => {
    const token = asAdmin()
    mocked.organization.findUnique.mockResolvedValue({ id: 'org-1' } as never)
    mocked.trustScore.findMany.mockResolvedValue([{ id: 'ts-2', score: 65 }, { id: 'ts-1', score: 50 }] as never)

    const res = await request(app).get('/api/admin/trust/org-1/history').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(mocked.trustScore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orgId: 'org-1' } }),
    )
  })
})

describe('POST /api/admin/trust/:orgId/override', () => {
  it('is forbidden for a regular admin', async () => {
    const token = asAdmin(false)
    const res = await request(app)
      .post('/api/admin/trust/org-1/override')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 90, reason: 'Manual review' })
    expect(res.status).toBe(403)
    expect(mocked.trustScore.create).not.toHaveBeenCalled()
  })

  it('creates an override entry and an audit log for a super admin', async () => {
    const token = asAdmin(true)
    mocked.organization.findUnique.mockResolvedValue({ id: 'org-1' } as never)
    mocked.trustScore.create.mockResolvedValue({ id: 'ts-9', score: 90, reasonCodes: ['ADMIN_OVERRIDE: Manual review'], orgId: 'org-1' } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .post('/api/admin/trust/org-1/override')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 90, reason: 'Manual review' })

    expect(res.status).toBe(201)
    expect(res.body.score).toBe(90)
    expect(mocked.trustScore.create).toHaveBeenCalledWith({
      data: { score: 90, reasonCodes: ['ADMIN_OVERRIDE: Manual review'], orgId: 'org-1' },
    })
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'TRUST_SCORE_OVERRIDDEN',
        newData: { score: 90, reason: 'Manual review' },
        adminId: SUPER_ADMIN_FIXTURE.id,
        orgId: 'org-1',
      }),
    })
  })

  it.each([
    [{ score: 101, reason: 'too high' }],
    [{ score: -1, reason: 'negative' }],
    [{ score: 55.5, reason: 'not an int' }],
    [{ score: 50, reason: '' }],
    [{ score: 50 }],
  ])('rejects an invalid body %j', async (body) => {
    const token = asAdmin(true)
    const res = await request(app)
      .post('/api/admin/trust/org-1/override')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
    expect(res.status).toBe(400)
    expect(mocked.trustScore.create).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown org (super admin)', async () => {
    const token = asAdmin(true)
    mocked.organization.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/admin/trust/missing/override')
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 50, reason: 'x' })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/trust/:orgId/recalculate', () => {
  it('queues a recalculation and writes an audit log', async () => {
    const token = asAdmin()
    mocked.organization.findUnique.mockResolvedValue({ id: 'org-1' } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .post('/api/admin/trust/org-1/recalculate')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(202)
    expect(mockedQueue.enqueue).toHaveBeenCalledWith('org-1')
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'TRUST_SCORE_RECALCULATE_REQUESTED', orgId: 'org-1' }),
    })
  })

  it('returns 404 for an unknown org', async () => {
    const token = asAdmin()
    mocked.organization.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/admin/trust/missing/recalculate')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(mockedQueue.enqueue).not.toHaveBeenCalled()
  })
})
