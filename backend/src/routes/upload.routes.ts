import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = Router();

// Endpoint d'upload : /upload
router.post('/', isAuthenticated, upload.single('file'), uploadImage);

export default router;
