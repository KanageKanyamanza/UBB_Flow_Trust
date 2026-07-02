import { Router } from 'express'
import { AdminSystemController } from '../../controllers/admin/admin-system.controller.js'
import { isAdminAuthenticated, requireSuperAdmin } from '../../middleware/admin.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAdminAuthenticated)

router.get('/health', AdminSystemController.health)
router.get('/redis-stats', AdminSystemController.redisStats)
router.post('/cache/flush', requireSuperAdmin, AdminSystemController.flushCache)

export default router
