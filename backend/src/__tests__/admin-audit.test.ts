import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    auditLog: { findMany: vi.fn(), count: vi.fn() },
  },
}))

import prisma from '../config/prisma.js'
import adminAuditRouter from '../routes/admin/admin-audit.routes.js'
import { makeApp, ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/audit', adminAuditRouter)
const mocked = vi.mocked(prisma, true)

function asAdmin() {
  mocked.admin.findUnique.mockResolvedValue(ADMIN_FIXTURE as never)
  return adminToken()
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/audit', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/audit')
    expect(res.status).toBe(401)
  })

  it('returns paginated logs with the org flattened', async () => {
    const token = asAdmin()
    mocked.auditLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        action: 'ORG_SUSPENDED',
        entityType: 'Organization',
        entityId: 'org-1',
        createdAt: new Date().toISOString(),
        user: null,
        admin: { email: 'admin@trustlane.io' },
        organization: { name: 'Acme SARL' },
      },
    ] as never)
    mocked.auditLog.count.mockResolvedValue(120 as never)

    const res = await request(app).get('/api/admin/audit?page=2').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ total: 120, page: 2, pageSize: 50 })
    expect(res.body.data[0]).toMatchObject({ id: 'log-1', org: { name: 'Acme SARL' } })
    expect(mocked.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 50 }),
    )
  })

  it('applies orgId, action, entityType and date filters', async () => {
    const token = asAdmin()
    mocked.auditLog.findMany.mockResolvedValue([] as never)
    mocked.auditLog.count.mockResolvedValue(0 as never)

    await request(app)
      .get('/api/admin/audit?orgId=org-1&action=SUSPEND&entityType=Organization&from=2026-01-01&to=2026-06-30')
      .set('Authorization', `Bearer ${token}`)

    expect(mocked.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orgId: 'org-1',
          action: { contains: 'SUSPEND', mode: 'insensitive' },
          entityType: 'Organization',
          createdAt: { gte: new Date('2026-01-01'), lte: new Date('2026-06-30') },
        },
      }),
    )
  })
})

describe('GET /api/admin/audit/export', () => {
  it('exports logs as a CSV attachment', async () => {
    const token = asAdmin()
    mocked.auditLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        action: 'DOCUMENT_VERIFIED',
        entityType: 'Document',
        entityId: 'doc-1',
        createdAt: new Date('2026-07-01T10:00:00Z'),
        user: null,
        admin: { email: 'admin@trustlane.io' },
        organization: { name: 'Acme "quoted" SARL' },
      },
    ] as never)

    const res = await request(app).get('/api/admin/audit/export').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('audit-logs.csv')

    const lines = res.text.trim().split('\n')
    expect(lines[0]).toBe('ID,Action,Entity Type,Entity ID,User/Admin,Organization,Created At')
    expect(lines[1]).toContain('"DOCUMENT_VERIFIED"')
    expect(lines[1]).toContain('"admin@trustlane.io"')
    // double quotes must be CSV-escaped
    expect(lines[1]).toContain('"Acme ""quoted"" SARL"')
  })

  it('falls back to System when the log has no actor', async () => {
    const token = asAdmin()
    mocked.auditLog.findMany.mockResolvedValue([
      {
        id: 'log-2',
        action: 'CRON_RUN',
        entityType: 'System',
        entityId: 'cron',
        createdAt: new Date(),
        user: null,
        admin: null,
        organization: null,
      },
    ] as never)

    const res = await request(app).get('/api/admin/audit/export').set('Authorization', `Bearer ${token}`)
    expect(res.text).toContain('"System"')
    expect(res.text).toContain('"—"')
  })

  it('passes the same filters as the list endpoint', async () => {
    const token = asAdmin()
    mocked.auditLog.findMany.mockResolvedValue([] as never)

    await request(app)
      .get('/api/admin/audit/export?orgId=org-1&action=VERIFY')
      .set('Authorization', `Bearer ${token}`)

    expect(mocked.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId: 'org-1', action: { contains: 'VERIFY', mode: 'insensitive' } },
      }),
    )
  })
})
