import { Router } from 'express'
import { AdminOrgsController } from '../../controllers/admin/admin-orgs.controller.js'
import { isAdminAuthenticated, requireSuperAdmin } from '../../middleware/admin.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAdminAuthenticated)

router.get('/', AdminOrgsController.list)
router.get('/:id', AdminOrgsController.getOne)
router.patch('/:id/suspend', AdminOrgsController.suspend)
router.get('/:id/audit-logs', AdminOrgsController.auditLogs)
router.delete('/:id', requireSuperAdmin, AdminOrgsController.delete)

export default router
