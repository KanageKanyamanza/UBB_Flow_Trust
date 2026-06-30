import { Router } from 'express'
import { AdminAuthController } from '../../controllers/admin/admin-auth.controller.js'
import { isAdminAuthenticated } from '../../middleware/admin.middleware.js'

const router = Router()

router.post('/login', AdminAuthController.login)
router.post('/refresh', AdminAuthController.refresh)
router.get('/me', isAdminAuthenticated, AdminAuthController.getMe)
router.post('/logout', isAdminAuthenticated, AdminAuthController.logout)

export default router
