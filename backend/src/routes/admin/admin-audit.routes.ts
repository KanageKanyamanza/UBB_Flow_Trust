import { Router } from 'express'
import { AdminAuditController } from '../../controllers/admin/admin-audit.controller.js'
import { isAdminAuthenticated } from '../../middleware/admin.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAdminAuthenticated)

router.get('/', AdminAuditController.list)

export default router
