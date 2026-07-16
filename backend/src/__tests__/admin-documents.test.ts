import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../config/prisma.js', () => ({
  default: {
    admin: { findUnique: vi.fn() },
    document: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock('../services/storage.service.js', () => ({
  storageService: { getFileBuffer: vi.fn() },
}))

import prisma from '../config/prisma.js'
import { storageService } from '../services/storage.service.js'
import adminDocumentsRouter from '../routes/admin/admin-documents.routes.js'
import { makeApp, ADMIN_FIXTURE, adminToken } from './helpers.js'

const app = makeApp('/api/admin/documents', adminDocumentsRouter)
const mocked = vi.mocked(prisma, true)
const mockedStorage = vi.mocked(storageService, true)

function asAdmin() {
  mocked.admin.findUnique.mockResolvedValue(ADMIN_FIXTURE as never)
  return adminToken()
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/admin/documents', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/documents')
    expect(res.status).toBe(401)
  })

  it('lists documents with the latest version and flattened org', async () => {
    const token = asAdmin()
    mocked.document.findMany.mockResolvedValue([
      {
        id: 'doc-1',
        type: 'RCCM',
        name: 'RCCM Acme',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        organization: { id: 'org-1', name: 'Acme SARL' },
        versions: [{ id: 'v1', fileUrl: 'u', fileName: 'rccm.pdf', createdAt: new Date().toISOString() }],
      },
    ] as never)
    mocked.document.count.mockResolvedValue(1 as never)

    const res = await request(app).get('/api/admin/documents').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data[0]).toMatchObject({ id: 'doc-1', org: { id: 'org-1' } })
  })

  it('filters by status', async () => {
    const token = asAdmin()
    mocked.document.findMany.mockResolvedValue([] as never)
    mocked.document.count.mockResolvedValue(0 as never)

    await request(app)
      .get('/api/admin/documents?status=PENDING')
      .set('Authorization', `Bearer ${token}`)

    expect(mocked.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PENDING' } }),
    )
  })
})

describe('PATCH /api/admin/documents/:id/verify', () => {
  it('marks the document VERIFIED and writes an audit log with the orgId', async () => {
    const token = asAdmin()
    mocked.document.update.mockResolvedValue({ id: 'doc-1', status: 'VERIFIED', orgId: 'org-1' } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .patch('/api/admin/documents/doc-1/verify')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('VERIFIED')
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_VERIFIED',
        entityId: 'doc-1',
        orgId: 'org-1',
        adminId: ADMIN_FIXTURE.id,
      }),
    })
  })

  it('returns 404 for a missing document', async () => {
    const token = asAdmin()
    mocked.document.update.mockRejectedValue(new Error('not found'))
    const res = await request(app)
      .patch('/api/admin/documents/missing/verify')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/admin/documents/:id/reject', () => {
  it('requires a non-empty rejection reason', async () => {
    const token = asAdmin()

    const noBody = await request(app)
      .patch('/api/admin/documents/doc-1/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(noBody.status).toBe(400)

    const emptyReason = await request(app)
      .patch('/api/admin/documents/doc-1/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: '' })
    expect(emptyReason.status).toBe(400)
    expect(mocked.document.update).not.toHaveBeenCalled()
  })

  it('marks the document REJECTED and stores the reason in the audit log', async () => {
    const token = asAdmin()
    mocked.document.update.mockResolvedValue({ id: 'doc-1', status: 'REJECTED', orgId: 'org-1' } as never)
    mocked.auditLog.create.mockResolvedValue({} as never)

    const res = await request(app)
      .patch('/api/admin/documents/doc-1/reject')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Document illisible' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('REJECTED')
    expect(mocked.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_REJECTED',
        newData: { reason: 'Document illisible' },
      }),
    })
  })
})

describe('GET /api/admin/documents/:id/download', () => {
  it('returns 404 when the document has no version', async () => {
    const token = asAdmin()
    mocked.document.findUnique.mockResolvedValue({ id: 'doc-1', versions: [] } as never)
    const res = await request(app)
      .get('/api/admin/documents/doc-1/download')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('streams the latest version inline with the right content type', async () => {
    const token = asAdmin()
    mocked.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      versions: [{ fileUrl: 'orgs/org-1/rccm.pdf', fileName: 'rccm.pdf' }],
    } as never)
    mockedStorage.getFileBuffer.mockResolvedValue(Buffer.from('%PDF-1.4') as never)

    const res = await request(app)
      .get('/api/admin/documents/doc-1/download')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(res.headers['content-disposition']).toContain('inline')
  })

  it('sends an attachment disposition when download=true', async () => {
    const token = asAdmin()
    mocked.document.findUnique.mockResolvedValue({
      id: 'doc-1',
      versions: [{ fileUrl: 'orgs/org-1/photo.png', fileName: 'photo.png' }],
    } as never)
    mockedStorage.getFileBuffer.mockResolvedValue(Buffer.from('png') as never)

    const res = await request(app)
      .get('/api/admin/documents/doc-1/download?download=true')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('image/png')
    expect(res.headers['content-disposition']).toContain('attachment')
  })
})
