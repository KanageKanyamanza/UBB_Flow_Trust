import { Router } from 'express'
import { AdminAlertsController } from '../../controllers/admin/admin-alerts.controller.js'
import { isAdminAuthenticated } from '../../middleware/admin.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAdminAuthenticated)

router.get('/', AdminAlertsController.list)
router.post('/:id/acknowledge', AdminAlertsController.acknowledge)
router.post('/broadcast', AdminAlertsController.broadcast)

export default router
