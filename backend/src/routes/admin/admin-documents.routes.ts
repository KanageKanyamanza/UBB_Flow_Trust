import { Router } from 'express'
import { AdminDocumentsController } from '../../controllers/admin/admin-documents.controller.js'
import { isAdminAuthenticated } from '../../middleware/admin.middleware.js'

const router = Router()

router.use(isAdminAuthenticated)

router.get('/', AdminDocumentsController.list)
router.get('/:id', AdminDocumentsController.getOne)
router.patch('/:id/verify', AdminDocumentsController.verify)
router.patch('/:id/reject', AdminDocumentsController.reject)

export default router
