/**
 * Integration test: full admin flow
 * login → list pending documents → verify one → trust score recalculation queued
 * Prisma is mocked; the flow exercises the real routers, middlewares and services chained together.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import argon2 from 'argon2'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn(), update: vi.fn() },
    document: { findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    organization: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock('../services/score-queue.service.js', () => ({
  scoreQueue: { enqueue: vi.fn() },
}))

import prisma from '../config/prisma.js'
import { scoreQueue } from '../services/score-queue.service.js'
import adminAuthRouter from '../routes/admin/admin-auth.routes.js'
import adminDocumentsRouter from '../routes/admin/admin-documents.routes.js'
import adminTrustRouter from '../routes/admin/admin-trust.routes.js'
import { ADMIN_FIXTURE } from './helpers.js'

const mocked = vi.mocked(prisma, true)

const app = express()
app.use(express.json())
app.use('/api/admin/auth', adminAuthRouter)
app.use('/api/admin/documents', adminDocumentsRouter)
app.use('/api/admin/trust', adminTrustRouter)

const PASSWORD = 'Fl0w-e2e-Pass!'
let dbAdmin: Record<string, unknown>

beforeAll(async () => {
  dbAdmin = { ...ADMIN_FIXTURE, password: await argon2.hash(PASSWORD), refreshToken: null }
})

describe('admin end-to-end flow', () => {
  it('login → review pending document → verify → recalculate trust score', async () => {
    // -- 1. Login
    mocked.admin.findUnique.mockResolvedValue(dbAdmin as never)
    mocked.admin.update.mockResolvedValue(dbAdmin as never)

    const login = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: ADMIN_FIXTURE.email, password: PASSWORD })
    expect(login.status).toBe(200)
    const token = login.body.accessToken as string
    const auth = { Authorization: `Bearer ${token}` }

    // -- 2. List pending documents
    mocked.document.findMany.mockResolvedValue([
      {
        id: 'doc-1',
        type: 'RCCM',
        name: 'RCCM Acme',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        organization: { id: 'org-1', name: 'Acme SARL' },
        versions: [],
      },
    ] as never)
    mocked.document.count.mockResolvedValue(1 as never)

    const pending = await request(app).get('/api/admin/documents?status=PENDING').set(auth)
    expect(pending.status).toBe(200)
    const doc = pending.body.data[0]
    expect(doc.status).toBe('PENDING')

    // -- 3. Verify the document
    mocked.document.update.mockResolvedValue({ id: doc.id, status: 'VERIFIED', orgId: 'org-1' } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const verified = await request(app).patch(`/api/admin/documents/${doc.id}/verify`).set(auth)
    expect(verified.status).toBe(200)
    expect(verified.body.status).toBe('VERIFIED')

    // -- 4. Trigger the trust score recalculation for the org
    mocked.organization.findUnique.mockResolvedValue({ id: 'org-1' } as never)

    const recalc = await request(app).post(`/api/admin/trust/${verified.body.orgId}/recalculate`).set(auth)
    expect(recalc.status).toBe(202)
    expect(vi.mocked(scoreQueue).enqueue).toHaveBeenCalledWith('org-1')

    // -- 5. The whole flow left an audit trail
    const actions = mocked.auditLog.create.mock.calls.map((c) => (c[0] as { data: { action: string } }).data.action)
    expect(actions).toEqual(['DOCUMENT_VERIFIED', 'TRUST_SCORE_RECALCULATE_REQUESTED'])
  })

  it('rejects the whole flow without a token', async () => {
    const res = await request(app).patch('/api/admin/documents/doc-1/verify')
    expect(res.status).toBe(401)
  })
})
