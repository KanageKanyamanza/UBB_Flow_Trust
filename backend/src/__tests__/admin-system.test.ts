import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('../services/redis.service.js', () => ({
  RedisService: {
    isConnected: vi.fn(),
    getStats: vi.fn(),
    flushAll: vi.fn(),
  },
}))

vi.mock('../services/cron.service.js', () => ({
  CronService: {
    lastRun: null,
    status: 'idle',
  },
}))

import prisma from '../config/prisma.js'
import { RedisService } from '../services/redis.service.js'
import adminSystemRouter from '../routes/admin/admin-system.routes.js'
import { makeApp, ADMIN_FIXTURE, SUPER_ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/system', adminSystemRouter)
const mocked = vi.mocked(prisma, true)
const mockedRedis = vi.mocked(RedisService, true)

function asAdmin(superAdmin = false) {
  const fixture = superAdmin ? SUPER_ADMIN_FIXTURE : ADMIN_FIXTURE
  mocked.admin.findUnique.mockResolvedValue(fixture as never)
  return adminToken(fixture.id, fixture.email)
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/system/health', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/system/health')
    expect(res.status).toBe(401)
  })

  it('reports OK when database and redis are up', async () => {
    const token = asAdmin()
    mocked.$queryRaw.mockResolvedValue([{ '?column?': 1 }] as never)
    mockedRedis.isConnected.mockReturnValue(true)

    const res = await request(app).get('/api/admin/system/health').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('OK')
    expect(res.body.database.status).toBe('up')
    expect(res.body.redis.status).toBe('up')
  })

  it('reports DEGRADED when the database is down', async () => {
    const token = asAdmin()
    mocked.$queryRaw.mockRejectedValue(new Error('connection refused'))
    mockedRedis.isConnected.mockReturnValue(true)

    const res = await request(app).get('/api/admin/system/health').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('DEGRADED')
    expect(res.body.database.status).toBe('down')
  })

  it('reports DEGRADED when redis is down', async () => {
    const token = asAdmin()
    mocked.$queryRaw.mockResolvedValue([{ '?column?': 1 }] as never)
    mockedRedis.isConnected.mockReturnValue(false)

    const res = await request(app).get('/api/admin/system/health').set('Authorization', `Bearer ${token}`)
    expect(res.body.status).toBe('DEGRADED')
    expect(res.body.redis.status).toBe('down')
  })
})

describe('POST /api/admin/system/cache/flush', () => {
  it('is forbidden for a regular admin', async () => {
    const token = asAdmin(false)
    const res = await request(app)
      .post('/api/admin/system/cache/flush')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
    expect(mockedRedis.flushAll).not.toHaveBeenCalled()
  })

  it('flushes the cache and writes an audit log for a super admin', async () => {
    const token = asAdmin(true)
    mockedRedis.flushAll.mockResolvedValue(undefined as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .post('/api/admin/system/cache/flush')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
    expect(mockedRedis.flushAll).toHaveBeenCalled()
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'CACHE_FLUSHED', adminId: SUPER_ADMIN_FIXTURE.id }),
    })
  })
})

describe('GET /api/admin/system/redis-stats', () => {
  it('returns the redis stats', async () => {
    const token = asAdmin()
    mockedRedis.getStats.mockResolvedValue({ keys: 42, memory: '1M' } as never)
    const res = await request(app).get('/api/admin/system/redis-stats').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ keys: 42, memory: '1M' })
  })
})

describe('GET /api/admin/system/cron-status', () => {
  it('describes the scheduled job with its next run', async () => {
    const token = asAdmin()
    const res = await request(app).get('/api/admin/system/cron-status').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.jobs).toHaveLength(1)
    expect(res.body.jobs[0]).toMatchObject({ schedule: '0 8 * * *', status: 'idle', lastRun: null })
    expect(new Date(res.body.jobs[0].nextRun).getTime()).toBeGreaterThan(Date.now())
  })
})
