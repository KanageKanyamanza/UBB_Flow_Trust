import type { Response } from 'express'
import { z } from 'zod'
import { TransactionService } from '../services/transaction.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'
import { TxnDirection, TxnMethod, TxnCategory } from '@prisma/client'

const createSchema = z.object({
  amount: z.number().positive(),
  direction: z.nativeEnum(TxnDirection),
  currency: z.string().optional().default('XAF'),
  method: z.nativeEnum(TxnMethod),
  category: z.nativeEnum(TxnCategory),
  counterparty: z.string().optional(),
  notes: z.string().optional(),
  occurredAt: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  accountId: z.string().uuid(),
})

const querySchema = z.object({
  accountId: z.string().uuid().optional(),
  category: z.nativeEnum(TxnCategory).optional(),
  direction: z.nativeEnum(TxnDirection).optional(),
  startDate: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
  endDate: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
})

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  direction: z.nativeEnum(TxnDirection).optional(),
  currency: z.string().optional(),
  method: z.nativeEnum(TxnMethod).optional(),
  category: z.nativeEnum(TxnCategory).optional(),
  counterparty: z.string().optional(),
  notes: z.string().optional(),
  occurredAt: z.string().datetime().optional().transform(s => s ? new Date(s) : undefined),
})

export class TransactionController {
  // ... other methods ...

  /**
   * Update a transaction and its balance impact
   */
  static async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = req.params.id as string

      // Verify the transaction belongs to the user's assigned account if restricted
      const existingTx = await TransactionService.getById(id, req.user.orgId)
      if (req.user.accountId && existingTx.accountId !== req.user.accountId) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this transaction' })
      }

      const validatedData = updateSchema.parse(req.body)
      const transaction = await TransactionService.update(id, req.user.orgId, validatedData, req.user.id)
      
      res.json(transaction)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: message })
    }
  }

  /**
   * List all transactions with optional filters
   */
  static async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const filters = querySchema.parse(req.query)

      // Restrict search to user's assigned account
      if (req.user.accountId) {
        filters.accountId = req.user.accountId
      }

      const transactions = await TransactionService.listByOrg(req.user.orgId, filters)
      res.json(transactions)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query filters', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: message })
    }
  }

  /**
   * Create a new transaction
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const validatedData = createSchema.parse(req.body)

      // Ensure the transaction is being created for the user's assigned account
      if (req.user.accountId && validatedData.accountId !== req.user.accountId) {
        return res.status(403).json({ error: 'Forbidden: You can only create transactions for your assigned account' })
      }

      const transaction = await TransactionService.create({
        ...validatedData,
        orgId: req.user.orgId,
      })
      
      res.status(201).json(transaction)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: message })
    }
  }

  /**
   * Get a single transaction details
   */
  static async getOne(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = req.params.id as string
      const transaction = await TransactionService.getById(id, req.user.orgId)

      // Check if transaction belongs to user's assigned account
      if (req.user.accountId && transaction.accountId !== req.user.accountId) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this transaction' })
      }
      
      res.json(transaction)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(404).json({ error: message })
    }
  }

  /**
   * Delete a transaction (reverses balance impact)
   */
  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = req.params.id as string
      const transaction = await TransactionService.getById(id, req.user.orgId)

      // Check if transaction belongs to user's assigned account
      if (req.user.accountId && transaction.accountId !== req.user.accountId) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this transaction' })
      }

      await TransactionService.delete(id, req.user.orgId)
      res.status(204).send()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(404).json({ error: message })
    }
  }
}
