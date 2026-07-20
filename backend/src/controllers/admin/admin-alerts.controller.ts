import type { Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'
import { RedisService } from '../../services/redis.service.js'

const PAGE_SIZE = 30

export class AdminAlertsController {
  static async list(req: AdminRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1)
    const severity = req.query.severity ? String(req.query.severity) : undefined

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (severity) where.severity = severity

    const [rows, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: [{ isAck: 'asc' }, { createdAt: 'desc' }],
        include: { organization: { select: { id: true, name: true } } },
      }),
      prisma.alert.count({ where }),
    ])

    const data = rows.map((row: any) => {
      const { organization, ...rest } = row
      return { ...rest, org: organization }
    })

    res.json({ data, total, page, pageSize: PAGE_SIZE })
  }

  static async acknowledge(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    try {
      const alert = await prisma.alert.update({
        where: { id },
        data: { isAck: true },
        select: { id: true, isAck: true, severity: true, type: true, orgId: true },
      })
      await prisma.auditLog.create({
        data: {
          action: 'ALERT_ACKNOWLEDGED',
          entityType: 'Alert',
          entityId: id,
          adminId: req.admin!.id,
          orgId: alert.orgId,
        },
      })
      res.json(alert)
    } catch {
      res.status(404).json({ error: 'Alert not found' })
    }
  }

  static async broadcast(req: AdminRequest, res: Response) {
    // Alert.orgId is a required, NOT NULL column (no org-less/global alert
    // support in the schema yet), so every broadcast must target an org.
    const schema = z.object({
      orgId: z.string().min(1),
      severity: z.enum(['CRITICAL', 'WARN', 'INFO']),
      type: z.string().min(1),
      message: z.string().min(1)
    })
    try {
      const { orgId, severity, type, message } = schema.parse(req.body)

      const alert = await prisma.alert.create({
        data: {
          orgId,
          severity,
          type,
          message,
          isAck: false
        }
      })

      await RedisService.del(`alerts:${orgId}:active`)

      await prisma.auditLog.create({
        data: {
          action: 'ALERT_BROADCASTED',
          entityType: 'Alert',
          entityId: alert.id,
          adminId: req.admin!.id,
          orgId,
        }
      })

      res.status(201).json(alert)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid body', details: error.issues })
      res.status(500).json({ error: (error as any).message })
    }
  }
}
