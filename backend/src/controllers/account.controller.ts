import type { Response } from 'express'
import { z } from 'zod'
import { AccountService } from '../services/account.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

const createSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['BANK', 'MOBILE_MONEY', 'CASH', 'OTHER']),
  currency: z.string().optional().default('XAF'),
  balance: z.number().optional().default(0),
})

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(['BANK', 'MOBILE_MONEY', 'CASH', 'OTHER']).optional(),
  currency: z.string().optional(),
  balance: z.number().optional(),
})

export class AccountController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      // Assigned users (managers) are not allowed to create accounts/shops
      if (req.user.accountId) {
        return res.status(403).json({ error: 'Forbidden: Managers cannot create accounts' })
      }

      const validatedData = createSchema.parse(req.body)
      const account = await AccountService.create({
        ...validatedData,
        orgId: req.user.orgId,
      })
      
      res.status(201).json(account)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: message })
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      // If manager has assigned account, only return that account
      if (req.user.accountId) {
        const account = await AccountService.getById(req.user.accountId, req.user.orgId)
        return res.json([account])
      }

      const accounts = await AccountService.listByOrg(req.user.orgId)
      res.json(accounts)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: message })
    }
  }

  static async getOne(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = req.params.id as string

      // Block access to other accounts
      if (req.user.accountId && req.user.accountId !== id) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this account' })
      }

      const account = await AccountService.getById(id, req.user.orgId)
      res.json(account)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(404).json({ error: message })
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = req.params.id as string

      // Block access to other accounts
      if (req.user.accountId && req.user.accountId !== id) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this account' })
      }

      const validatedData = updateSchema.parse(req.body)
      const account = await AccountService.update(id, req.user.orgId, validatedData)
      res.json(account)
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
      
      // Assigned users (managers) are not allowed to delete accounts/shops
      if (req.user.accountId) {
        return res.status(403).json({ error: 'Forbidden: Managers cannot delete accounts' })
      }

      const id = req.params.id as string
      await AccountService.delete(id, req.user.orgId)
      
      res.status(204).send()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(404).json({ error: message })
    }
  }
}
