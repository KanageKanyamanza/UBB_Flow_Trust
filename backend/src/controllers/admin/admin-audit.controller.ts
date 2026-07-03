import type { Response } from 'express'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const PAGE_SIZE = 50

export class AdminAuditController {
  static async list(req: AdminRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1)
    const orgId = req.query.orgId ? String(req.query.orgId) : undefined
    const userId = req.query.userId ? String(req.query.userId) : undefined
    const action = req.query.action ? String(req.query.action) : undefined
    const entityType = req.query.entityType ? String(req.query.entityType) : undefined
    const from = req.query.from ? String(req.query.from) : undefined
    const to = req.query.to ? String(req.query.to) : undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (orgId) where.orgId = orgId
    if (userId) where.userId = userId
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (entityType) where.entityType = entityType
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          admin: { select: { email: true } },
          organization: { select: { name: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    const data = rows.map((row: any) => {
      const { organization, ...rest } = row
      return { ...rest, org: organization }
    })

    res.json({ data, total, page, pageSize: PAGE_SIZE })
  }
}
