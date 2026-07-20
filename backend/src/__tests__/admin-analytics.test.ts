import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    organization: { count: vi.fn(), findMany: vi.fn() },
    user: { count: vi.fn() },
    document: { count: vi.fn(), groupBy: vi.fn() },
    trustScore: { aggregate: vi.fn(), findMany: vi.fn() },
    alert: { count: vi.fn() },
  },
}))

import prisma from '../config/prisma.js'
import adminAnalyticsRouter from '../routes/admin/admin-analytics.routes.js'
import { makeApp, ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/analytics', adminAnalyticsRouter)
const mocked = vi.mocked(prisma, true)

function asAdmin() {
  mocked.admin.findUnique.mockResolvedValue(ADMIN_FIXTURE as never)
  return adminToken()
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/analytics/overview', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/analytics/overview')
    expect(res.status).toBe(401)
  })

  it('returns the KPIs with a rounded average trust score', async () => {
    const token = asAdmin()
    mocked.organization.count.mockResolvedValue(12 as never)
    mocked.user.count.mockResolvedValue(48 as never)
    mocked.document.count.mockResolvedValue(7 as never)
    mocked.trustScore.aggregate.mockResolvedValue({ _avg: { score: 66.6 } } as never)
    mocked.alert.count.mockResolvedValue(3 as never)

    const res = await request(app).get('/api/admin/analytics/overview').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      totalOrgs: 12,
      totalUsers: 48,
      pendingDocuments: 7,
      avgTrustScore: 67,
      criticalAlerts: 3,
    })
  })

  it('defaults the average trust score to 0 when there are no scores', async () => {
    const token = asAdmin()
    mocked.organization.count.mockResolvedValue(0 as never)
    mocked.user.count.mockResolvedValue(0 as never)
    mocked.document.count.mockResolvedValue(0 as never)
    mocked.trustScore.aggregate.mockResolvedValue({ _avg: { score: null } } as never)
    mocked.alert.count.mockResolvedValue(0 as never)

    const res = await request(app).get('/api/admin/analytics/overview').set('Authorization', `Bearer ${token}`)
    expect(res.body.avgTrustScore).toBe(0)
  })
})

describe('GET /api/admin/analytics/registrations', () => {
  it('buckets registrations over the last 12 months', async () => {
    const token = asAdmin()
    const now = new Date()
    mocked.organization.findMany.mockResolvedValue([
      { createdAt: now },
      { createdAt: now },
      { createdAt: new Date(now.getFullYear() - 3, 0, 1) }, // out of window: ignored
    ] as never)

    const res = await request(app).get('/api/admin/analytics/registrations').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(12)
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentBucket = res.body.find((b: { month: string }) => b.month === currentKey)
    expect(currentBucket.count).toBe(2)
    const totalCounted = res.body.reduce((sum: number, b: { count: number }) => sum + b.count, 0)
    expect(totalCounted).toBe(2)
  })
})

describe('GET /api/admin/analytics/documents-by-status', () => {
  it('maps the groupBy result to {status, count}', async () => {
    const token = asAdmin()
    mocked.document.groupBy.mockResolvedValue([
      { status: 'VERIFIED', _count: { status: 5 } },
      { status: 'PENDING', _count: { status: 2 } },
    ] as never)

    const res = await request(app)
      .get('/api/admin/analytics/documents-by-status')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { status: 'VERIFIED', count: 5 },
      { status: 'PENDING', count: 2 },
    ])
  })
})

describe('GET /api/admin/analytics/trust-distribution', () => {
  it('keeps only the latest score per org and buckets by range', async () => {
    const token = asAdmin()
    // findMany is ordered createdAt desc: first entry per org wins
    mocked.trustScore.findMany.mockResolvedValue([
      { orgId: 'org-1', score: 85 }, // latest for org-1
      { orgId: 'org-1', score: 10 }, // older: ignored
      { orgId: 'org-2', score: 20 },
      { orgId: 'org-3', score: 60 },
    ] as never)

    const res = await request(app)
      .get('/api/admin/analytics/trust-distribution')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      { range: '0-20', count: 1 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 1 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 1 },
    ])
  })
})
