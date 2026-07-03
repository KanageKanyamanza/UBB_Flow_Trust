import { Router } from 'express'
import { AnalyticsController } from '../controllers/analytics.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router: ReturnType<typeof Router> = Router()

// Apply auth middleware to all analytics routes
router.use(isAuthenticated)

router.get('/summary', AnalyticsController.getSummaryByCategory)
router.get('/daily-balance', AnalyticsController.getDailyBalances)
router.get('/stats', AnalyticsController.getDashboardStats)
router.get('/forecast', AnalyticsController.getForecast)
router.get('/projections', AnalyticsController.getProjections)

export default router
