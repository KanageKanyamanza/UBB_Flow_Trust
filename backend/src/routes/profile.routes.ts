import { Router } from 'express'
import { ProfileController } from '../controllers/profile.controller.js'
import { isAuthenticated, authorizeRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(isAuthenticated)
router.use(authorizeRole(['OWNER']))

router.get('/', ProfileController.get)
router.put('/', ProfileController.update)

export default router
