import { Router } from 'express';
import { uploadImage, scanImage } from '../controllers/upload.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = Router();

// Endpoint d'upload : /upload
router.post('/', isAuthenticated, upload.single('file'), uploadImage);

// Endpoint de scan OCR : /upload/scan
router.post('/scan', isAuthenticated, upload.single('file'), scanImage);

export default router;
