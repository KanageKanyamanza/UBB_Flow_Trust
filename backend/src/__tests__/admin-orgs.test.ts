import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    organization: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: { create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    pushSubscription: { deleteMany: vi.fn() },
    evidenceFile: { deleteMany: vi.fn() },
    checklistItem: { deleteMany: vi.fn() },
    documentVersion: { deleteMany: vi.fn() },
    document: { deleteMany: vi.fn() },
    checklist: { deleteMany: vi.fn() },
    beneficialOwner: { deleteMany: vi.fn() },
    smeProfile: { deleteMany: vi.fn() },
    publicProfile: { deleteMany: vi.fn() },
    consentGrant: { deleteMany: vi.fn() },
    alert: { deleteMany: vi.fn() },
    trustScore: { deleteMany: vi.fn() },
    readinessScoreFlow: { deleteMany: vi.fn() },
    forecastSnapshot: { deleteMany: vi.fn() },
    recurringRule: { deleteMany: vi.fn() },
    budget: { deleteMany: vi.fn() },
    transaction: { deleteMany: vi.fn() },
    user: { deleteMany: vi.fn() },
    account: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import prisma from '../config/prisma.js'
import adminOrgsRouter from '../routes/admin/admin-orgs.routes.js'
import { makeApp, ADMIN_FIXTURE, SUPER_ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/orgs', adminOrgsRouter)
const mocked = vi.mocked(prisma, true)

const ORG_ROW = {
  id: 'org-1',
  name: 'Acme SARL',
  isSuspended: false,
  createdAt: new Date().toISOString(),
  _count: { users: 3, documents: 5 },
  trustScores: [{ score: 72 }],
  users: [{ email: 'owner@acme.com', firstName: 'Olga', lastName: 'Owner' }],
}

function asAdmin(superAdmin = false) {
  const fixture = superAdmin ? SUPER_ADMIN_FIXTURE : ADMIN_FIXTURE
  mocked.admin.findUnique.mockResolvedValue(fixture as never)
  return adminToken(fixture.id, fixture.email)
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/orgs', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/orgs')
    expect(res.status).toBe(401)
  })

  it('returns a paginated list with flattened trustScore and owner', async () => {
    const token = asAdmin()
    mocked.organization.findMany.mockResolvedValue([ORG_ROW] as never)
    mocked.organization.count.mockResolvedValue(41 as never)

    const res = await request(app).get('/api/admin/orgs?page=2').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ total: 41, page: 2, pageSize: 20 })
    expect(res.body.data[0]).toMatchObject({
      id: 'org-1',
      trustScore: { score: 72 },
      owner: { email: 'owner@acme.com' },
    })
    expect(mocked.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    )
  })

  it('filters by suspended status and search term', async () => {
    const token = asAdmin()
    mocked.organization.findMany.mockResolvedValue([] as never)
    mocked.organization.count.mockResolvedValue(0 as never)

    await request(app)
      .get('/api/admin/orgs?suspended=true&search=acme')
      .set('Authorization', `Bearer ${token}`)

    expect(mocked.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isSuspended: true, name: { contains: 'acme', mode: 'insensitive' } },
      }),
    )
  })
})

describe('PATCH /api/admin/orgs/:id/suspend', () => {
  it('suspends an organization and writes an audit log', async () => {
    const token = asAdmin()
    mocked.organization.update.mockResolvedValue({ id: 'org-1', name: 'Acme SARL', isSuspended: true } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .patch('/api/admin/orgs/org-1/suspend')
      .set('Authorization', `Bearer ${token}`)
      .send({ suspend: true })

    expect(res.status).toBe(200)
    expect(res.body.isSuspended).toBe(true)
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ORG_SUSPENDED', entityId: 'org-1', adminId: ADMIN_FIXTURE.id }),
    })
  })

  it('reactivates an organization with suspend=false', async () => {
    const token = asAdmin()
    mocked.organization.update.mockResolvedValue({ id: 'org-1', name: 'Acme SARL', isSuspended: false } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .patch('/api/admin/orgs/org-1/suspend')
      .set('Authorization', `Bearer ${token}`)
      .send({ suspend: false })

    expect(res.status).toBe(200)
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ORG_REACTIVATED' }),
    })
  })

  it('rejects a body without the suspend boolean', async () => {
    const token = asAdmin()
    const res = await request(app)
      .patch('/api/admin/orgs/org-1/suspend')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
    expect(mocked.organization.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the organization does not exist', async () => {
    const token = asAdmin()
    mocked.organization.update.mockRejectedValue(new Error('not found'))
    const res = await request(app)
      .patch('/api/admin/orgs/missing/suspend')
      .set('Authorization', `Bearer ${token}`)
      .send({ suspend: true })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/admin/orgs/:id', () => {
  it('is forbidden for a regular admin', async () => {
    const token = asAdmin(false)
    const res = await request(app).delete('/api/admin/orgs/org-1').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
    expect(mocked.organization.findUnique).not.toHaveBeenCalled()
    expect(mocked.$transaction).not.toHaveBeenCalled()
  })

  it('returns 404 for a missing organization without touching dependent data (super admin)', async () => {
    const token = asAdmin(true)
    mocked.organization.findUnique.mockResolvedValue(null)

    const res = await request(app).delete('/api/admin/orgs/missing').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(mocked.$transaction).not.toHaveBeenCalled()
  })

  it('cascades the delete through every dependent table, then logs, for a super admin', async () => {
    const token = asAdmin(true)
    mocked.organization.findUnique.mockResolvedValue({ id: 'org-1' } as never)
    mocked.$transaction.mockResolvedValue([] as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app).delete('/api/admin/orgs/org-1').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
    expect(mocked.$transaction).toHaveBeenCalledTimes(1)
    // organization.delete must be the last statement of the cascade, after every dependent deleteMany
    expect(mocked.organization.delete).toHaveBeenCalledWith({ where: { id: 'org-1' } })
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ORG_DELETED', entityId: 'org-1', adminId: SUPER_ADMIN_FIXTURE.id }),
    })
  })

  it('preserves audit logs (nulling orgId/userId) instead of deleting them', async () => {
    const token = asAdmin(true)
    mocked.organization.findUnique.mockResolvedValue({ id: 'org-1' } as never)
    mocked.$transaction.mockResolvedValue([] as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    await request(app).delete('/api/admin/orgs/org-1').set('Authorization', `Bearer ${token}`)

    expect(mocked.auditLog.updateMany).toHaveBeenCalledWith({
      where: { user: { orgId: 'org-1' } },
      data: { userId: null },
    })
    expect(mocked.auditLog.updateMany).toHaveBeenCalledWith({
      where: { orgId: 'org-1' },
      data: { orgId: null },
    })
  })

  it('returns 500 with a real error message if the cascade fails (does not mask it as 404)', async () => {
    const token = asAdmin(true)
    mocked.organization.findUnique.mockResolvedValue({ id: 'org-1' } as never)
    mocked.$transaction.mockRejectedValue(new Error('deadlock detected'))

    const res = await request(app).delete('/api/admin/orgs/org-1').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(500)
    expect(res.body.details).toBe('deadlock detected')
  })
})

describe('GET /api/admin/orgs/:id', () => {
  it('returns 404 when not found', async () => {
    const token = asAdmin()
    mocked.organization.findUnique.mockResolvedValue(null)
    const res = await request(app).get('/api/admin/orgs/missing').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
