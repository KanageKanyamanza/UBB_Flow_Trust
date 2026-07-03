import type { Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma.js'
import { scoreQueue } from '../../services/score-queue.service.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const PAGE_SIZE = 20

export class AdminTrustController {
  static async list(req: AdminRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1)

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          trustScores: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, score: true, reasonCodes: true, createdAt: true },
          },
        },
      }),
      prisma.organization.count(),
    ])

    const data = orgs
      .filter((o: any) => o.trustScores.length > 0)
      .map((o: any) => ({ ...o.trustScores[0], org: { id: o.id, name: o.name } }))

    res.json({ data, total, page, pageSize: PAGE_SIZE })
  }

  static async history(req: AdminRequest, res: Response) {
    const orgId = String(req.params.orgId)
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } })
    if (!org) return res.status(404).json({ error: 'Organization not found' })

    const scores = await prisma.trustScore.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(scores)
  }

  static async override(req: AdminRequest, res: Response) {
    const orgId = String(req.params.orgId)
    const schema = z.object({
      score: z.number().int().min(0).max(100),
      reason: z.string().min(1),
    })
    try {
      const { score, reason } = schema.parse(req.body)
      const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } })
      if (!org) return res.status(404).json({ error: 'Organization not found' })

      const entry = await prisma.trustScore.create({
        data: { score, reasonCodes: [`ADMIN_OVERRIDE: ${reason}`], orgId },
      })

      await prisma.auditLog.create({
        data: {
          action: 'TRUST_SCORE_OVERRIDDEN',
          entityType: 'TrustScore',
          entityId: entry.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newData: { score, reason } as any,
          adminId: req.admin!.id,
          orgId,
        },
      })

      res.status(201).json(entry)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid body', details: error.issues })
      res.status(500).json({ error: 'Failed to override trust score' })
    }
  }

  static async recalculate(req: AdminRequest, res: Response) {
    const orgId = String(req.params.orgId)
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } })
    if (!org) return res.status(404).json({ error: 'Organization not found' })

    scoreQueue.enqueue(orgId)

    await prisma.auditLog.create({
      data: {
        action: 'TRUST_SCORE_RECALCULATE_REQUESTED',
        entityType: 'Organization',
        entityId: orgId,
        adminId: req.admin!.id,
        orgId,
      },
    })

    res.status(202).json({ message: 'Recalculation queued', orgId })
  }
}
