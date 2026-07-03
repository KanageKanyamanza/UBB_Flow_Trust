import { Router } from 'express'
import { AdminAnalyticsController } from '../../controllers/admin/admin-analytics.controller.js'
import { isAdminAuthenticated } from '../../middleware/admin.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAdminAuthenticated)

router.get('/overview', AdminAnalyticsController.overview)
router.get('/registrations', AdminAnalyticsController.registrations)
router.get('/documents-by-status', AdminAnalyticsController.documentsByStatus)
router.get('/trust-distribution', AdminAnalyticsController.trustDistribution)

export default router
