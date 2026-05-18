import type { Request, Response } from 'express';
import { storageService } from '../services/storage.service.js';
import prisma from '../config/prisma.js';
import { OcrService } from '../services/ocr.service.js';

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier fourni' });
      return;
    }

    const { buffer, originalname, size } = req.file;
    const { txnId } = req.body; // optionnel: id de transaction pour lier le fichier de preuve en DB

    // Process and store the image
    const fileUrl = await storageService.processAndStoreImage(buffer);

    let dbRecord = null;

    // Liaison DB: si un txnId est fourni, on enregistre le fichier comme preuve
    if (txnId) {
      dbRecord = await prisma.evidenceFile.create({
        data: {
          txnId,
          fileUrl,
          fileName: originalname,
        }
      });
    }

    res.json({
      message: 'Fichier uploadé et compressé avec succès',
      url: fileUrl,
      fileName: originalname,
      size,
      evidenceFile: dbRecord
    });
  } catch (error: any) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: error.message || "Erreur serveur lors de l'upload" });
  }
};

export const scanImage = async (req: Request, res: Response): Promise<void> => {
  try {
    let base64Image = req.body.image;
    const { mode } = req.body;

    // Si on reçoit un fichier via multer (multipart/form-data)
    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
    }

    if (!base64Image) {
      res.status(400).json({ error: 'Image (base64 ou fichier) manquante' });
      return;
    }

    const text = await OcrService.scanImage(base64Image);
    const extractedData = OcrService.extractData(text, mode);

    res.json({
      text,
      data: extractedData
    });
  } catch (error: any) {
    console.error("Erreur lors du scan OCR:", error);
    res.status(500).json({ error: error.message || "Erreur serveur lors du scan" });
  }
};
