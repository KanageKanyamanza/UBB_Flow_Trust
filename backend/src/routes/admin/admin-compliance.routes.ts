import { Router } from 'express'
import { AdminComplianceController } from '../../controllers/admin/admin-compliance.controller.js'
import { isAdminAuthenticated, requireSuperAdmin } from '../../middleware/admin.middleware.js'

const router = Router()

router.use(isAdminAuthenticated)

router.get('/templates', AdminComplianceController.listTemplates)
router.post('/templates', requireSuperAdmin, AdminComplianceController.createTemplate)
router.put('/templates/:id', requireSuperAdmin, AdminComplianceController.updateTemplate)
router.delete('/templates/:id', requireSuperAdmin, AdminComplianceController.deleteTemplate)
router.get('/stats', AdminComplianceController.stats)

export default router
