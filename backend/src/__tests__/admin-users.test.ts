import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: { create: vi.fn(), updateMany: vi.fn() },
    pushSubscription: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import prisma from '../config/prisma.js'
import adminUsersRouter from '../routes/admin/admin-users.routes.js'
import { makeApp, ADMIN_FIXTURE, SUPER_ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/users', adminUsersRouter)
const mocked = vi.mocked(prisma, true)

function asAdmin(superAdmin = false) {
  const fixture = superAdmin ? SUPER_ADMIN_FIXTURE : ADMIN_FIXTURE
  mocked.admin.findUnique.mockResolvedValue(fixture as never)
  return adminToken(fixture.id, fixture.email)
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/users', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('lists users cross-organizations with pagination', async () => {
    const token = asAdmin()
    mocked.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'u@acme.com',
        firstName: 'U',
        lastName: 'One',
        role: 'MEMBER',
        isBlocked: false,
        createdAt: new Date().toISOString(),
        organization: { id: 'org-1', name: 'Acme SARL' },
      },
    ] as never)
    mocked.user.count.mockResolvedValue(1 as never)

    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data[0]).toMatchObject({ id: 'user-1', org: { id: 'org-1' } })
    expect(res.body.data[0].organization).toBeUndefined()
  })

  it('applies role, orgId and search filters', async () => {
    const token = asAdmin()
    mocked.user.findMany.mockResolvedValue([] as never)
    mocked.user.count.mockResolvedValue(0 as never)

    await request(app)
      .get('/api/admin/users?role=OWNER&orgId=org-9&search=jane')
      .set('Authorization', `Bearer ${token}`)

    expect(mocked.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'OWNER',
          orgId: 'org-9',
          OR: expect.arrayContaining([{ email: { contains: 'jane', mode: 'insensitive' } }]),
        }),
      }),
    )
  })
})

describe('PATCH /api/admin/users/:id', () => {
  it('updates the role and records old/new data in the audit log', async () => {
    const token = asAdmin()
    mocked.user.findUnique.mockResolvedValue({ role: 'MEMBER', isBlocked: false } as never)
    mocked.user.update.mockResolvedValue({ id: 'user-1', email: 'u@acme.com', role: 'OWNER', isBlocked: false } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .patch('/api/admin/users/user-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'OWNER' })

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('OWNER')
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'USER_UPDATED',
        oldData: { role: 'MEMBER', isBlocked: false },
        newData: { role: 'OWNER' },
        adminId: ADMIN_FIXTURE.id,
      }),
    })
  })

  it('returns 404 when the user does not exist', async () => {
    const token = asAdmin()
    mocked.user.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .patch('/api/admin/users/missing')
      .set('Authorization', `Bearer ${token}`)
      .send({ isBlocked: true })
    expect(res.status).toBe(404)
    expect(mocked.user.update).not.toHaveBeenCalled()
  })

  it('rejects an invalid body', async () => {
    const token = asAdmin()
    const res = await request(app)
      .patch('/api/admin/users/user-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ isBlocked: 'yes' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/admin/users/:id/reset-password', () => {
  it('returns a temporary password whose hash is persisted', async () => {
    const token = asAdmin()
    mocked.user.findUnique.mockResolvedValue({ id: 'user-1' } as never)
    mocked.user.update.mockResolvedValue({} as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .post('/api/admin/users/user-1/reset-password')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.tempPassword).toBeTruthy()

    const updateArg = mocked.user.update.mock.calls[0][0] as { data: { password: string } }
    expect(updateArg.data.password).not.toBe(res.body.tempPassword)
    await expect(argon2.verify(updateArg.data.password, res.body.tempPassword)).resolves.toBe(true)

    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'USER_PASSWORD_RESET', entityId: 'user-1' }),
    })
  })

  it('returns 404 for a missing user', async () => {
    const token = asAdmin()
    mocked.user.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/admin/users/missing/reset-password')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/admin/users/:id', () => {
  it('is forbidden for a regular admin', async () => {
    const token = asAdmin(false)
    const res = await request(app).delete('/api/admin/users/user-1').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
    expect(mocked.$transaction).not.toHaveBeenCalled()
  })

  it('deletes in a transaction and logs when called by a super admin', async () => {
    const token = asAdmin(true)
    mocked.user.findUnique.mockResolvedValue({ id: 'user-1' } as never)
    mocked.$transaction.mockResolvedValue([] as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app).delete('/api/admin/users/user-1').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
    expect(mocked.$transaction).toHaveBeenCalled()
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'USER_DELETED', adminId: SUPER_ADMIN_FIXTURE.id }),
    })
  })

  it('returns 404 for a missing user (super admin)', async () => {
    const token = asAdmin(true)
    mocked.user.findUnique.mockResolvedValue(null)
    const res = await request(app).delete('/api/admin/users/missing').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
