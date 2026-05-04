import { Router } from 'express'
import { ProfileController } from '../controllers/profile.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

router.use(isAuthenticated)

router.get('/', ProfileController.get)
router.put('/', ProfileController.update)

export default router
