import { Router } from 'express'
import { AdminUsersController } from '../../controllers/admin/admin-users.controller.js'
import { isAdminAuthenticated, requireSuperAdmin } from '../../middleware/admin.middleware.js'

const router = Router()

router.use(isAdminAuthenticated)

router.get('/', AdminUsersController.list)
router.get('/:id', AdminUsersController.getOne)
router.patch('/:id', AdminUsersController.update)
router.post('/:id/reset-password', AdminUsersController.resetPassword)
router.delete('/:id', requireSuperAdmin, AdminUsersController.delete)

export default router
