import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    alert: { findMany: vi.fn(), count: vi.fn(), update: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock('../services/redis.service.js', () => ({
  RedisService: {
    del: vi.fn(),
    invalidatePattern: vi.fn(),
  },
}))

import prisma from '../config/prisma.js'
import { RedisService } from '../services/redis.service.js'
import adminAlertsRouter from '../routes/admin/admin-alerts.routes.js'
import { makeApp, ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/alerts', adminAlertsRouter)
const mocked = vi.mocked(prisma, true)
const mockedRedis = vi.mocked(RedisService, true)

function asAdmin() {
  mocked.admin.findUnique.mockResolvedValue(ADMIN_FIXTURE as never)
  return adminToken()
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/alerts', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/alerts')
    expect(res.status).toBe(401)
  })

  it('lists alerts with the org flattened and filters by severity', async () => {
    const token = asAdmin()
    mocked.alert.findMany.mockResolvedValue([
      { id: 'al-1', severity: 'CRITICAL', isAck: false, organization: { id: 'org-1', name: 'Acme' } },
    ] as never)
    mocked.alert.count.mockResolvedValue(1 as never)

    const res = await request(app)
      .get('/api/admin/alerts?severity=CRITICAL')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data[0]).toMatchObject({ id: 'al-1', org: { id: 'org-1' } })
    expect(mocked.alert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { severity: 'CRITICAL' } }),
    )
  })
})

describe('POST /api/admin/alerts/:id/acknowledge', () => {
  it('acknowledges the alert and writes an audit log', async () => {
    const token = asAdmin()
    mocked.alert.update.mockResolvedValue({ id: 'al-1', isAck: true, severity: 'WARN', type: 'THRESHOLD', orgId: 'org-1' } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .post('/api/admin/alerts/al-1/acknowledge')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.isAck).toBe(true)
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ALERT_ACKNOWLEDGED', entityId: 'al-1', orgId: 'org-1' }),
    })
  })

  it('returns 404 for a missing alert', async () => {
    const token = asAdmin()
    mocked.alert.update.mockRejectedValue(new Error('not found'))
    const res = await request(app)
      .post('/api/admin/alerts/missing/acknowledge')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/alerts/broadcast', () => {
  it('creates an org-scoped alert and invalidates that org cache only', async () => {
    const token = asAdmin()
    mocked.alert.create.mockResolvedValue({ id: 'al-2', severity: 'INFO', orgId: 'org-1' } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .post('/api/admin/alerts/broadcast')
      .set('Authorization', `Bearer ${token}`)
      .send({ orgId: 'org-1', severity: 'INFO', type: 'ANNOUNCEMENT', message: 'Maintenance ce soir' })

    expect(res.status).toBe(201)
    expect(mockedRedis.del).toHaveBeenCalledWith('alerts:org-1:active')
    expect(mockedRedis.invalidatePattern).not.toHaveBeenCalled()
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'ALERT_BROADCASTED', orgId: 'org-1' }),
    })
  })

  it.each([
    [{ severity: 'BOGUS', type: 'X', message: 'm', orgId: 'org-1' }],
    [{ severity: 'INFO', type: '', message: 'm', orgId: 'org-1' }],
    [{ severity: 'INFO', type: 'X', message: '', orgId: 'org-1' }],
    // Alert.orgId is NOT NULL in the schema: broadcast has no org-less/global mode
    [{ severity: 'INFO', type: 'X', message: 'm' }],
    [{ severity: 'INFO', type: 'X', message: 'm', orgId: '' }],
    [{}],
  ])('rejects an invalid body %j', async (body) => {
    const token = asAdmin()
    const res = await request(app)
      .post('/api/admin/alerts/broadcast')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
    expect(res.status).toBe(400)
    expect(mocked.alert.create).not.toHaveBeenCalled()
  })
})
