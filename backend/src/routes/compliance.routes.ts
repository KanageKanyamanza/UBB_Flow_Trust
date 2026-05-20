import { Router } from 'express'
import { ComplianceController } from '../controllers/compliance.controller.js'
import { isAuthenticated, authorizeRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(isAuthenticated)
router.use(authorizeRole(['OWNER']))

router.post('/start', ComplianceController.start)
router.get('/', ComplianceController.get)
router.get('/gap', ComplianceController.getGap)

export default router
