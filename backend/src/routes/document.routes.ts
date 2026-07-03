import { Router } from 'express'
import { DocumentController } from '../controllers/document.controller.js'
import { isAuthenticated, authorizeRole } from '../middleware/auth.middleware.js'
import { uploadDoc } from '../middleware/upload.middleware.js'

const router: ReturnType<typeof Router> = Router()

router.use(isAuthenticated)
router.use(authorizeRole(['OWNER']))

router.post('/', uploadDoc.single('file'), DocumentController.upload)
router.get('/', DocumentController.list)
router.get('/logs', DocumentController.getLogs)
router.post('/:id/versions', uploadDoc.single('file'), DocumentController.addVersion)
router.delete('/:id', DocumentController.delete)

export default router
