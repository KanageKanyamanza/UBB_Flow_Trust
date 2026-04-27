import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware.js'
import { BudgetService } from '../services/budget.service.js'

export class BudgetController {
  static async getBudgets(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId
      const budgets = await BudgetService.getBudgets(orgId)
      res.json(budgets)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async setBudget(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId
      const { category, amount } = req.body
      const budget = await BudgetService.setBudget(orgId, category, amount)
      res.json(budget)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async getComparison(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId
      const { month, year } = req.query
      
      const m = month ? parseInt(month as string) : undefined
      const y = year ? parseInt(year as string) : undefined

      const comparison = await BudgetService.getBudgetVsActual(orgId, m, y)
      res.json(comparison)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
