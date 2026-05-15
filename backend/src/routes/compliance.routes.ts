import { Router } from 'express'
import { ComplianceController } from '../controllers/compliance.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

router.use(isAuthenticated)

router.post('/start', ComplianceController.start)
router.get('/', ComplianceController.get)
router.get('/gap', ComplianceController.getGap)

export default router
