import type { Request, Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware.js'
import { AnalyticsService } from '../services/analytics.service.js'

export class AnalyticsController {
  /**
   * GET /analytics/summary
   * Get transaction sums by category
   */
  static async getSummaryByCategory(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId
      const { startDate, endDate } = req.query

      const start = startDate ? new Date(startDate as string) : undefined
      let end = endDate ? new Date(endDate as string) : undefined
      
      if (end) {
        end.setHours(23, 59, 59, 999)
      }

      const summary = await AnalyticsService.getSummaryByCategory(orgId, start, end)
      res.json(summary)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * GET /analytics/daily-balance
   * Get net balance for each day in a range
   */
  static async getDailyBalances(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId
      const { startDate, endDate } = req.query

      // Default to last 30 days if no range provided
      let end = endDate ? new Date(endDate as string) : new Date()
      const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(end.getDate() - 30))

      // Ensure end date includes the entire day
      end.setHours(23, 59, 59, 999)

      const balances = await AnalyticsService.getDailyBalances(orgId, start, end)
      res.json(balances)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * GET /analytics/stats
   * Get advanced dashboard KPIs
   */
  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId
      const stats = await AnalyticsService.getKpis(orgId)
      res.json(stats)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * GET /analytics/forecast
   * Get predicted cash flow for the next 30 days
   */
  static async getForecast(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId
      const forecast = await AnalyticsService.getForecast(orgId)
      res.json(forecast)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
