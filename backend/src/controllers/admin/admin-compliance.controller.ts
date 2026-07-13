import type { Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const templateSchema = z.object({
  market: z.string().min(1),
  requirements: z.array(z.string().min(1)).min(1),
})

export class AdminComplianceController {
  static async listTemplates(_req: AdminRequest, res: Response) {
    const templates = await prisma.checklistTemplate.findMany({ orderBy: { market: 'asc' } })
    res.json(templates)
  }

  static async createTemplate(req: AdminRequest, res: Response) {
    try {
      const data = templateSchema.parse(req.body)
      const template = await prisma.checklistTemplate.create({ data })
      await prisma.auditLog.create({
        data: {
          action: 'COMPLIANCE_TEMPLATE_CREATED',
          entityType: 'ChecklistTemplate',
          entityId: template.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newData: data as any,
          adminId: req.admin!.id,
        },
      })
      res.status(201).json(template)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.issues })
      res.status(400).json({ error: 'Market already exists' })
    }
  }

  static async updateTemplate(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    try {
      const data = templateSchema.parse(req.body)
      const template = await prisma.checklistTemplate.update({ where: { id }, data })
      await prisma.auditLog.create({
        data: {
          action: 'COMPLIANCE_TEMPLATE_UPDATED',
          entityType: 'ChecklistTemplate',
          entityId: id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newData: data as any,
          adminId: req.admin!.id,
        },
      })
      res.json(template)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.issues })
      res.status(404).json({ error: 'Template not found' })
    }
  }

  static async deleteTemplate(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    try {
      await prisma.checklistTemplate.delete({ where: { id } })
      await prisma.auditLog.create({
        data: { action: 'COMPLIANCE_TEMPLATE_DELETED', entityType: 'ChecklistTemplate', entityId: id, adminId: req.admin!.id },
      })
      res.status(204).send()
    } catch {
      res.status(404).json({ error: 'Template not found' })
    }
  }

  static async listChecklists(_req: AdminRequest, res: Response) {
    const checklists = await prisma.checklist.findMany({
      include: {
        organization: { select: { id: true, name: true } },
        items: { select: { id: true, requirement: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(checklists)
  }

  static async stats(_req: AdminRequest, res: Response) {
    const [totalOrgs, totalChecklists, itemCounts, checklists] = await Promise.all([
      prisma.organization.count(),
      prisma.checklist.count(),
      prisma.checklistItem.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.checklist.findMany({
        select: {
          market: true,
          items: { select: { status: true } }
        }
      })
    ])

    const itemsByStatus = Object.fromEntries(
      itemCounts.map((row: any) => [row.status, row._count.status])
    )

    const localStats = { PASS: 0, FAIL: 0, IN_REVIEW: 0, MISSING: 0, NOT_APPLICABLE: 0 }
    const euStats = { PASS: 0, FAIL: 0, IN_REVIEW: 0, MISSING: 0, NOT_APPLICABLE: 0 }

    checklists.forEach((cl: any) => {
      const target = cl.market === 'LOCAL' ? localStats : euStats
      cl.items.forEach((item: any) => {
        const s = item.status as keyof typeof target
        if (target[s] !== undefined) {
          target[s]++
        }
      })
    })

    res.json({
      totalOrgs,
      totalChecklists,
      itemsByStatus,
      markets: {
        LOCAL: localStats,
        EU: euStats
      }
    })
  }
}
