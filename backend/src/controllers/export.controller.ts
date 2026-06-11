import type { Response } from 'express'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const archiver = require('archiver')
import path from 'path'
import prisma from '../config/prisma.js'
import { PdfGeneratorService } from '../services/pdf-generator.service.js'
import { storageService } from '../services/storage.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

export class ExportController {
  /**
   * GET /api/export/bank-pack
   * Télécharge un dossier complet compressé (ZIP) contenant le rapport de synthèse PDF
   * et l'ensemble des pièces justificatives de la Data Room.
   */
  static async exportBankPack(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non autorisé : Utilisateur non authentifié' })
      }

      const orgId = req.user.orgId
      const userId = req.user.id

      // 1. Récupérer la liste des documents de la Data Room
      const documents = await prisma.document.findMany({
        where: { orgId },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      // 2. Générer le PDF de synthèse financière & conformité
      const pdfBuffer = await PdfGeneratorService.generateBankPackPdf(orgId)

      // 3. Configurer l'archive ZIP et la réponse HTTP pour le téléchargement
      const archive = archiver('zip', {
        zlib: { level: 9 } // Niveau maximum de compression
      })

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="bank-pack-${orgId}.zip"`)

      // Gérer les erreurs sur l'archive zip
      archive.on('error', (err: any) => {
        throw err
      })

      // Envoyer le zip directement en flux de sortie (response)
      archive.pipe(res)

      // 4. Ajouter la fiche synthèse PDF au ZIP
      archive.append(pdfBuffer, { name: 'synthese_conformite.pdf' })

      // 5. Ajouter toutes les pièces de la Data Room
      for (const doc of documents) {
        const latestVersion = doc.versions[0]
        if (latestVersion) {
          try {
            // Télécharger/récupérer le buffer du fichier depuis le StorageService
            const fileBuffer = await storageService.getFileBuffer(latestVersion.fileUrl)
            
            // Conserver l'extension d'origine ou utiliser .pdf par défaut
            const ext = path.extname(latestVersion.fileName) || '.pdf'
            
            // Nom propre et normalisé pour le fichier dans le ZIP
            const cleanDocType = doc.type.toUpperCase()
            const cleanFileName = `documents/${cleanDocType}_${latestVersion.fileName}`
            
            archive.append(fileBuffer, { name: cleanFileName })
          } catch (err) {
            console.error(`[export-controller]: Impossible d'ajouter le document ${doc.name} au ZIP:`, err)
            // On continue pour ne pas bloquer l'export des autres fichiers
          }
        }
      }

      // 6. Logger l'action d'exportation dans AuditLog
      await prisma.auditLog.create({
        data: {
          action: 'OWNER_EXPORT_BANK_PACK',
          entityType: 'Organization',
          entityId: orgId,
          orgId,
          userId,
          newData: {
            timestamp: new Date().toISOString(),
            documentsCount: documents.length
          }
        }
      })

      // Finaliser l'écriture du ZIP, ce qui ferme le flux et termine la requête express
      await archive.finalize()

    } catch (error: any) {
      console.error('[export-controller]: Échec de l\'exportation du pack bancaire :', error)
      // Si les en-têtes ont déjà été envoyés, on ne peut pas renvoyer de JSON d'erreur, on détruit la connexion
      if (res.headersSent) {
        res.end()
        return
      }
      res.status(500).json({ error: `Échec de l'exportation du pack : ${error.message}` })
    }
  }
}
