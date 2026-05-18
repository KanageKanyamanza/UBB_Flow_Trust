import { Router } from 'express'
import { ConsentGrantController } from '../controllers/consent-grant.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

// Toutes les routes de gestion du consentement nécessitent d'être connecté
router.use(isAuthenticated)

router.post('/', ConsentGrantController.create)
router.get('/', ConsentGrantController.list)
router.delete('/:id', ConsentGrantController.revoke)

export default router
