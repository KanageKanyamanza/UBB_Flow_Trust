import type { Response } from 'express'
import { z } from 'zod'
import { RecurringRuleService } from '../services/recurring-rule.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'
import { TxnDirection } from '@prisma/client'

const createSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  direction: z.nativeEnum(TxnDirection),
  frequency: z.string().min(1),
  startDate: z.string().datetime().transform(s => new Date(s)),
  endDate: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  direction: z.nativeEnum(TxnDirection).optional(),
  frequency: z.string().min(1).optional(),
  startDate: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  endDate: z.string().datetime().nullable().optional().transform(s => s === null ? null : (s ? new Date(s) : undefined)),
})

export class RecurringRuleController {
  static async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      const rules = await RecurringRuleService.listByOrg(req.user.orgId)
      res.json(rules)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: message })
    }
  }

  static async getOne(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      const rule = await RecurringRuleService.getById(req.params.id as string, req.user.orgId)
      res.json(rule)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(404).json({ error: message })
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      const validatedData = createSchema.parse(req.body)
      const rule = await RecurringRuleService.create({
        ...validatedData,
        orgId: req.user.orgId
      })
      res.status(201).json(rule)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: message })
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      const validatedData = updateSchema.parse(req.body)
      const rule = await RecurringRuleService.update(req.params.id as string, req.user.orgId, validatedData)
      res.json(rule)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: message })
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      await RecurringRuleService.delete(req.params.id as string, req.user.orgId)
      res.status(204).send()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(404).json({ error: message })
    }
  }
}
