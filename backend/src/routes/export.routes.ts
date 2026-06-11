import { Router } from 'express'
import { ExportController } from '../controllers/export.controller.js'
import { isAuthenticated, authorizeRole } from '../middleware/auth.middleware.js'

const router = Router()

// Protéger toutes les routes d'exportation pour les propriétaires de l'organisation
router.use(isAuthenticated)
router.use(authorizeRole(['OWNER']))

router.get('/bank-pack', ExportController.exportBankPack)

export default router
