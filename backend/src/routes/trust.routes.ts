import { Router } from 'express'
import { TrustController } from '../controllers/trust.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

router.use(isAuthenticated)

router.get('/score', TrustController.getScore)
router.post('/score/refresh', TrustController.refreshScore)

export default router
