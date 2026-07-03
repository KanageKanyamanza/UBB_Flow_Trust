import type { Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const PAGE_SIZE = 20

export class AdminDocumentsController {
  static async list(req: AdminRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1)
    const status = req.query.status ? String(req.query.status) : undefined
    const orgId = req.query.orgId ? String(req.query.orgId) : undefined
    const type = req.query.type ? String(req.query.type) : undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (status) where.status = status
    if (orgId) where.orgId = orgId
    if (type) where.type = { contains: type, mode: 'insensitive' }

    const [rows, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          name: true,
          status: true,
          createdAt: true,
          organization: { select: { id: true, name: true } },
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, fileUrl: true, fileName: true, createdAt: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ])

    const data = rows.map((row: any) => {
      const { organization, ...doc } = row
      return { ...doc, org: organization }
    })
    res.json({ data, total, page, pageSize: PAGE_SIZE })
  }

  static async getOne(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { id: true, name: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, fileUrl: true, fileName: true, fileSize: true, validUntil: true, createdAt: true },
        },
      },
    })
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    const { organization, ...rest } = doc
    res.json({ ...rest, org: organization })
  }

  static async verify(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    try {
      const doc = await prisma.document.update({
        where: { id },
        data: { status: 'VERIFIED' },
        select: { id: true, status: true, orgId: true },
      })
      await prisma.auditLog.create({
        data: {
          action: 'DOCUMENT_VERIFIED',
          entityType: 'Document',
          entityId: id,
          adminId: req.admin!.id,
          orgId: doc.orgId,
        },
      })
      res.json(doc)
    } catch {
      res.status(404).json({ error: 'Document not found' })
    }
  }

  static async reject(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const schema = z.object({ reason: z.string().min(1) })
    try {
      const { reason } = schema.parse(req.body)
      const doc = await prisma.document.update({
        where: { id },
        data: { status: 'REJECTED' },
        select: { id: true, status: true, orgId: true },
      })
      await prisma.auditLog.create({
        data: {
          action: 'DOCUMENT_REJECTED',
          entityType: 'Document',
          entityId: id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newData: { reason } as any,
          adminId: req.admin!.id,
          orgId: doc.orgId,
        },
      })
      res.json(doc)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid body', details: error.issues })
      res.status(404).json({ error: 'Document not found' })
    }
  }
}
