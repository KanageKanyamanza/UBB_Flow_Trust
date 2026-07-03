import { Router } from 'express'
import { AdminTrustController } from '../../controllers/admin/admin-trust.controller.js'
import { isAdminAuthenticated, requireSuperAdmin } from '../../middleware/admin.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAdminAuthenticated)

router.get('/', AdminTrustController.list)
router.get('/:orgId/history', AdminTrustController.history)
router.post('/:orgId/override', requireSuperAdmin, AdminTrustController.override)
router.post('/:orgId/recalculate', AdminTrustController.recalculate)

export default router
