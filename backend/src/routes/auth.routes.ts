import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/refresh', AuthController.refresh)
router.get('/me', isAuthenticated, AuthController.getMe)

// Team management (OWNER only)
router.get('/users', isAuthenticated, AuthController.listTeam)
router.post('/users', isAuthenticated, AuthController.createMember)
router.patch('/users/:id', isAuthenticated, AuthController.updateMember)
router.delete('/users/:id', isAuthenticated, AuthController.deleteMember)

export default router
