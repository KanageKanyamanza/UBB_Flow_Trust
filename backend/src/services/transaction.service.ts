import prisma from '../config/prisma.js'
import { TxnDirection, TxnMethod, TxnCategory } from '@prisma/client'
import { storageService } from './storage.service.js'
import { scoreQueue } from './score-queue.service.js'

export interface CreateTransactionInput {
  amount: number
  direction: TxnDirection
  currency?: string
  method: TxnMethod
  category: TxnCategory
  counterparty?: string
  notes?: string
  occurredAt?: Date
  accountId: string
  orgId: string
}

export interface UpdateTransactionInput {
  amount?: number
  direction?: TxnDirection
  currency?: string
  method?: TxnMethod
  category?: TxnCategory
  counterparty?: string
  notes?: string
  occurredAt?: Date
}

export class TransactionService {
  /**
   * List transactions for an organization with optional filtering
   */
  static async listByOrg(orgId: string, filters: {
    accountId?: string,
    category?: TxnCategory,
    direction?: TxnDirection,
    startDate?: Date,
    endDate?: Date
  } = {}) {
    const { accountId, category, direction, startDate, endDate } = filters
    
    return await prisma.transaction.findMany({
      where: {
        orgId,
        ...(accountId && { accountId }),
        ...(category && { category }),
        ...(direction && { direction }),
        ...(startDate || endDate ? {
          occurredAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          }
        } : {})
      },
      orderBy: { occurredAt: 'desc' },
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        },
        evidenceFiles: true
      }
    })
  }

  /**
   * Get a single transaction by ID and OrgID
   */
  static async getById(id: string, orgId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, orgId },
      include: {
        account: true,
        evidenceFiles: true
      }
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    return transaction
  }

  /**
   * Create a transaction and update the associated account balance
   */
  static async create(data: CreateTransactionInput) {
    // 1. Verify organization owns the account
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, orgId: data.orgId }
    })

    if (!account) {
      throw new Error('Account not found in this organization')
    }

    // 2. Perform transaction in a prisma transaction block
    const created = await prisma.$transaction(async (tx) => {
      // a. Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          direction: data.direction,
          currency: data.currency || 'XAF',
          method: data.method,
          category: data.category,
          counterparty: data.counterparty,
          notes: data.notes,
          occurredAt: data.occurredAt || new Date(),
          accountId: data.accountId,
          orgId: data.orgId,
        }
      })

      // b. Calculate amount impact
      const impact = data.direction === 'IN' ? data.amount : -data.amount

      // c. Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: impact
          }
        }
      })

      return transaction
    })

    // Déclenche un recalcul du score après création d'une transaction (pilier Activité)
    scoreQueue.enqueue(data.orgId)

    return created
  }

  /**
   * Update a transaction and adjust the account balance accordingly
   */
  static async update(id: string, orgId: string, data: UpdateTransactionInput, userId?: string) {
    // 1. Get original transaction to calculate balance delta
    const transaction = await this.getById(id, orgId)

    return await prisma.$transaction(async (tx) => {
      // a. Reverse old impact
      const oldImpact = transaction.direction === 'IN' ? -transaction.amount.toNumber() : transaction.amount.toNumber()
      
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            increment: oldImpact
          }
        }
      })

      // b. Apply updates to the transaction
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          amount: data.amount,
          direction: data.direction,
          currency: data.currency,
          method: data.method,
          category: data.category,
          counterparty: data.counterparty,
          notes: data.notes,
          occurredAt: data.occurredAt
        }
      })

      if (data.amount !== undefined && Number(transaction.amount) !== data.amount) {
        await tx.auditLog.create({
          data: {
            action: 'UPDATE_AMOUNT',
            entityType: 'Transaction',
            entityId: id,
            oldData: { amount: Number(transaction.amount) },
            newData: { amount: data.amount },
            orgId: orgId,
            ...(userId ? { userId } : {})
          }
        })
      }

      // c. Apply new impact
      const newImpact = updated.direction === 'IN' ? updated.amount.toNumber() : -updated.amount.toNumber()

      await tx.account.update({
        where: { id: updated.accountId },
        data: {
          balance: {
            increment: newImpact
          }
        }
      })

      return updated
    })
  }

  /**
   * Delete a transaction and reverse its impact on account balance
   */
  static async delete(id: string, orgId: string) {
    const transaction = await this.getById(id, orgId)

    // 1. Delete actual files from storage (S3/local)
    if (transaction.evidenceFiles && transaction.evidenceFiles.length > 0) {
      for (const file of transaction.evidenceFiles) {
        try {
          await storageService.deleteFile(file.fileUrl)
        } catch (err) {
          console.error(`Failed to delete storage file ${file.fileUrl}:`, err)
          // We continue anyway to not block DB deletion, 
          // though in a perfect world we might want more robust retry/cleanup.
        }
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 2. Reverse balance impact
      const impact = transaction.direction === 'IN' ? -transaction.amount.toNumber() : transaction.amount.toNumber()

      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            increment: impact
          }
        }
      })

      // 3. Delete evidence file records in DB
      await tx.evidenceFile.deleteMany({
        where: { txnId: id }
      })
      
      // 4. Delete the transaction
      const deleted = await tx.transaction.delete({
        where: { id }
      })

      return deleted
    }).then((deleted) => {
      // Déclenche un recalcul du score après suppression (pilier Activité)
      scoreQueue.enqueue(orgId)
      return deleted
    })
  }
}

