import prisma from '../config/prisma.js'
import { TxnCategory } from '@prisma/client'

export class BudgetService {
  static async getBudgets(orgId: string) {
    return prisma.budget.findMany({
      where: { orgId }
    })
  }

  static async setBudget(orgId: string, category: TxnCategory, amount: number) {
    return prisma.budget.upsert({
      where: {
        orgId_category_period: {
          orgId,
          category,
          period: 'MONTHLY'
        }
      },
      update: { amount },
      create: {
        orgId,
        category,
        amount,
        period: 'MONTHLY'
      }
    })
  }

  static async getBudgetVsActual(orgId: string, month?: number, year?: number) {
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
      where: { orgId, period: 'MONTHLY' }
    })

    const categories = Object.values(TxnCategory)

    return categories.map(cat => {
      const actual = actuals.find(a => a.category === cat)?._sum.amount || 0
      const budget = budgets.find(b => b.category === cat)?.amount || 0
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
