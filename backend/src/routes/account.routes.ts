import { Router } from 'express'
import { AccountController } from '../controllers/account.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router: ReturnType<typeof Router> = Router()

// All account routes require authentication
router.use(isAuthenticated)

router.post('/', AccountController.create)
router.get('/', AccountController.list)
router.get('/:id', AccountController.getOne)
router.patch('/:id', AccountController.update)
router.delete('/:id', AccountController.delete)

export default router
