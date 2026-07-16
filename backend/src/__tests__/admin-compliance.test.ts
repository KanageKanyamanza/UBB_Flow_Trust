import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    checklistTemplate: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    checklist: { findMany: vi.fn(), count: vi.fn() },
    checklistItem: { groupBy: vi.fn() },
    organization: { count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

import prisma from '../config/prisma.js'
import adminComplianceRouter from '../routes/admin/admin-compliance.routes.js'
import { makeApp, ADMIN_FIXTURE, SUPER_ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/compliance', adminComplianceRouter)
const mocked = vi.mocked(prisma, true)

function asAdmin(superAdmin = false) {
  const fixture = superAdmin ? SUPER_ADMIN_FIXTURE : ADMIN_FIXTURE
  mocked.admin.findUnique.mockResolvedValue(fixture as never)
  return adminToken(fixture.id, fixture.email)
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/compliance/templates', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/compliance/templates')
    expect(res.status).toBe(401)
  })

  it('lists templates for any admin', async () => {
    const token = asAdmin()
    mocked.checklistTemplate.findMany.mockResolvedValue([
      { id: 't-1', market: 'EU', requirements: ['GDPR'] },
    ] as never)
    const res = await request(app).get('/api/admin/compliance/templates').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('POST /api/admin/compliance/templates', () => {
  it('is forbidden for a regular admin', async () => {
    const token = asAdmin(false)
    const res = await request(app)
      .post('/api/admin/compliance/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({ market: 'EU', requirements: ['GDPR'] })
    expect(res.status).toBe(403)
  })

  it('creates a template and an audit log for a super admin', async () => {
    const token = asAdmin(true)
    mocked.checklistTemplate.create.mockResolvedValue({ id: 't-1', market: 'EU', requirements: ['GDPR'] } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .post('/api/admin/compliance/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({ market: 'EU', requirements: ['GDPR'] })

    expect(res.status).toBe(201)
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'COMPLIANCE_TEMPLATE_CREATED' }),
    })
  })

  it.each([
    [{ market: '', requirements: ['x'] }],
    [{ market: 'EU', requirements: [] }],
    [{ market: 'EU', requirements: [''] }],
    [{}],
  ])('rejects an invalid body %j', async (body) => {
    const token = asAdmin(true)
    const res = await request(app)
      .post('/api/admin/compliance/templates')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
    expect(res.status).toBe(400)
    expect(mocked.checklistTemplate.create).not.toHaveBeenCalled()
  })
})

describe('PUT /api/admin/compliance/templates/:id', () => {
  it('updates a template and logs the change (super admin)', async () => {
    const token = asAdmin(true)
    mocked.checklistTemplate.update.mockResolvedValue({ id: 't-1', market: 'LOCAL', requirements: ['RCCM'] } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .put('/api/admin/compliance/templates/t-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ market: 'LOCAL', requirements: ['RCCM'] })

    expect(res.status).toBe(200)
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'COMPLIANCE_TEMPLATE_UPDATED', entityId: 't-1' }),
    })
  })

  it('returns 404 for a missing template', async () => {
    const token = asAdmin(true)
    mocked.checklistTemplate.update.mockRejectedValue(new Error('not found'))
    const res = await request(app)
      .put('/api/admin/compliance/templates/missing')
      .set('Authorization', `Bearer ${token}`)
      .send({ market: 'LOCAL', requirements: ['RCCM'] })
    expect(res.status).toBe(404)
  })

  it('is forbidden for a regular admin', async () => {
    const token = asAdmin(false)
    const res = await request(app)
      .put('/api/admin/compliance/templates/t-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ market: 'LOCAL', requirements: ['RCCM'] })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/admin/compliance/templates/:id', () => {
  it('deletes and logs (super admin)', async () => {
    const token = asAdmin(true)
    mocked.checklistTemplate.delete.mockResolvedValue({} as never)
    mocked.auditLog.create.mockResolvedValue({} as never)
    const res = await request(app)
      .delete('/api/admin/compliance/templates/t-1')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)
  })

  it('is forbidden for a regular admin', async () => {
    const token = asAdmin(false)
    const res = await request(app)
      .delete('/api/admin/compliance/templates/t-1')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/compliance/stats', () => {
  it('aggregates item counts globally and per market', async () => {
    const token = asAdmin()
    mocked.organization.count.mockResolvedValue(4 as never)
    mocked.checklist.count.mockResolvedValue(2 as never)
    mocked.checklistItem.groupBy.mockResolvedValue([
      { status: 'PASS', _count: { status: 3 } },
      { status: 'FAIL', _count: { status: 1 } },
    ] as never)
    mocked.checklist.findMany.mockResolvedValue([
      { market: 'LOCAL', items: [{ status: 'PASS' }, { status: 'FAIL' }] },
      { market: 'EU', items: [{ status: 'PASS' }, { status: 'PASS' }] },
    ] as never)

    const res = await request(app).get('/api/admin/compliance/stats').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      totalOrgs: 4,
      totalChecklists: 2,
      itemsByStatus: { PASS: 3, FAIL: 1 },
    })
    expect(res.body.markets.LOCAL).toMatchObject({ PASS: 1, FAIL: 1 })
    expect(res.body.markets.EU).toMatchObject({ PASS: 2, FAIL: 0 })
  })
})
