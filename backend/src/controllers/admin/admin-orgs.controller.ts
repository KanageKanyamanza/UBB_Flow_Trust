import type { Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const PAGE_SIZE = 20

export class AdminOrgsController {
  static async list(req: AdminRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1)
    const search = req.query.search ? String(req.query.search) : undefined
    const suspendedParam = req.query.suspended as string | undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }
    if (suspendedParam !== undefined) where.isSuspended = suspendedParam === 'true'

    const [rows, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          isSuspended: true,
          createdAt: true,
          _count: { select: { users: true, documents: true } },
          trustScores: { orderBy: { createdAt: 'desc' }, take: 1, select: { score: true } },
          users: { where: { role: 'OWNER' }, take: 1, select: { email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.organization.count({ where }),
    ])

    const data = rows.map((row: any) => {
      const { trustScores, users, ...org } = row
      return { ...org, trustScore: trustScores[0] ?? null, owner: users[0] ?? null }
    })

    res.json({ data, total, page, pageSize: PAGE_SIZE })
  }

  static async getOne(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isBlocked: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
        accounts: { select: { id: true, name: true, type: true, currency: true, balance: true } },
        documents: {
          select: { id: true, name: true, type: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        trustScores: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { users: true, documents: true, transactions: true, alerts: true } },
      },
    })
    if (!org) return res.status(404).json({ error: 'Organization not found' })
    res.json(org)
  }

  static async suspend(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const schema = z.object({ suspend: z.boolean() })
    try {
      const { suspend } = schema.parse(req.body)
      const org = await prisma.organization.update({
        where: { id },
        data: { isSuspended: suspend },
        select: { id: true, name: true, isSuspended: true },
      })
      await prisma.auditLog.create({
        data: {
          action: suspend ? 'ORG_SUSPENDED' : 'ORG_REACTIVATED',
          entityType: 'Organization',
          entityId: id,
          adminId: req.admin!.id,
          orgId: id,
        },
      })
      res.json(org)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid body', details: error.issues })
      res.status(404).json({ error: 'Organization not found' })
    }
  }

  static async delete(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    try {
      await prisma.organization.delete({ where: { id } })
      await prisma.auditLog.create({
        data: { action: 'ORG_DELETED', entityType: 'Organization', entityId: id, adminId: req.admin!.id },
      })
      res.status(204).send()
    } catch {
      res.status(404).json({ error: 'Organization not found' })
    }
  }

  static async auditLogs(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const logs = await prisma.auditLog.findMany({
      where: { orgId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { email: true } },
        admin: { select: { email: true } },
      },
    })
    res.json(logs)
  }
}
