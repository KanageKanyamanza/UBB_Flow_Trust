import type { Response } from 'express'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

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
}
