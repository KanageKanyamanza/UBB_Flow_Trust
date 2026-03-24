import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/refresh', AuthController.refresh)
router.get('/me', isAuthenticated, AuthController.getMe)

export default router
