import { Router } from 'express'
import { AdminAdminsController } from '../../controllers/admin/admin-admins.controller.js'
import { isAdminAuthenticated, requireSuperAdmin } from '../../middleware/admin.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAdminAuthenticated, requireSuperAdmin)

router.get('/', AdminAdminsController.list)
router.post('/', AdminAdminsController.create)
router.delete('/:id', AdminAdminsController.delete)

export default router
