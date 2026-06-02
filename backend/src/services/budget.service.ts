import prisma from '../config/prisma.js'
import { TxnCategory } from '@prisma/client'

export class BudgetService {
  static async getBudgets(orgId: string, accountId?: string | null) {
    return prisma.budget.findMany({
      where: {
        orgId,
        accountId: accountId === undefined ? undefined : accountId
      }
    })
  }

  static async setBudget(orgId: string, category: TxnCategory, amount: number, accountId?: string | null) {
    return prisma.budget.upsert({
      where: {
        orgId_category_period_accountId: {
          orgId,
          category,
          period: 'MONTHLY',
          accountId: (accountId || null) as any
        }
      },
      update: { amount },
      create: {
        orgId,
        category,
        amount,
        period: 'MONTHLY',
        accountId: (accountId || null) as any
      }
    })
  }

  static async getBudgetVsActual(orgId: string, month?: number, year?: number, accountId?: string | null) {
    const now = new Date()
    const targetMonth = month !== undefined ? month : now.getMonth()
    const targetYear = year !== undefined ? year : now.getFullYear()

    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    const actuals = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        orgId,
        direction: 'OUT',
        accountId: accountId || undefined,
        occurredAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      }
    })

    const budgets = await prisma.budget.findMany({
      where: {
        orgId,
        period: 'MONTHLY',
        accountId: accountId === undefined ? undefined : accountId
      }
    })

    const budgetSums: Record<string, number> = {}
    for (const b of budgets) {
      const catStr = String(b.category)
      budgetSums[catStr] = (budgetSums[catStr] || 0) + Number(b.amount)
    }

    const categories = Object.values(TxnCategory)

    return categories.map(cat => {
      const actual = actuals.find(a => a.category === cat)?._sum.amount || 0
      const budget = budgetSums[cat] || 0
      return {
        category: cat,
        actual: Number(actual),
        budget: Number(budget),
        diff: Number(budget) - Number(actual),
        status: Number(budget) === 0 ? 'none' : (Number(actual) > Number(budget) ? 'over' : 'under')
      }
    })
  }
}
