import { Router } from 'express'
import { isAuthenticated } from '../middleware/auth.middleware.js'
import prisma from '../config/prisma.js'
import { PdfGeneratorService } from '../services/pdf-generator.service.js'
import archiver from 'archiver'
import path from 'path'
import fs from 'fs/promises'

const router = Router()

/**
 * GET /api/export/bank-pack (ou /export/bank-pack)
 * Génère le dossier bancaire zippé complet pour l'organisation connectée.
 */
// @ts-ignore - handler signature check
router.get('/bank-pack', isAuthenticated, async (req: any, res) => {
  try {
    const orgId = req.user.orgId

    // 1. Récupérer les informations de la PME
    const smeProfile = await prisma.smeProfile.findUnique({
      where: { orgId }
    })
    const legalName = smeProfile?.legalName || `PME_${orgId.substring(0, 8)}`
    const cleanLegalName = legalName.replace(/[^a-zA-Z0-9]/g, '_')

    // 2. Générer le rapport PDF certifié
    const pdfBuffer = await PdfGeneratorService.generateBankPackReport(orgId)

    // 3. Récupérer tous les documents valides de l'organisation
    const documents = await prisma.document.findMany({
      where: {
        orgId,
        status: { in: ['VERIFIED', 'SUBMITTED', 'DRAFT'] }
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    // 4. Configurer les en-têtes HTTP de réponse pour le téléchargement du ZIP
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Dossier_Bancaire_${cleanLegalName}.zip"`
    )

    // 5. Initialiser le flux ZIP à l'aide de la bibliothèque archiver
    const archive = archiver('zip', {
      zlib: { level: 9 } // Niveau maximum de compression
    })

    // Gérer les erreurs de compression
    archive.on('error', (err) => {
      console.error('[export-zip-error]:', err)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erreur lors de la création de l\'archive ZIP' })
      }
    })

    // Connecter l'archive à la réponse HTTP
    archive.pipe(res)

    // 6. Ajouter le rapport PDF généré à la racine du ZIP
    archive.append(pdfBuffer, { name: 'Rapport_Certification_UBB.pdf' })

    // 7. Parcourir et ajouter chaque document original au dossier ZIP
    for (const doc of documents) {
      const latestVersion = doc.versions[0]
      if (!latestVersion) continue

      const fileUrl = latestVersion.fileUrl
      const originalFileName = latestVersion.fileName
      const cleanFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      
      // Construire le chemin du fichier dans l'archive ZIP
      const zipFilePath = `Documents/${doc.status}_${doc.type}_${cleanFileName}`

      if (fileUrl.startsWith('http')) {
        // Cas 1 : Stockage Cloud (S3/Minio) -> Téléchargement via URL HTTP
        try {
          const response = await fetch(fileUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            archive.append(buffer, { name: zipFilePath })
          } else {
            console.error(`[export-zip]: Échec du téléchargement du fichier distant ${fileUrl} (Status: ${response.status})`)
          }
        } catch (err) {
          console.error(`[export-zip]: Erreur réseau pour le fichier distant ${fileUrl}:`, err)
        }
      } else {
        // Cas 2 : Stockage Local -> Lecture depuis le dossier uploads
        const filename = path.basename(fileUrl)
        const localPath = path.join(process.cwd(), 'uploads', filename)

        try {
          await fs.access(localPath)
          archive.file(localPath, { name: zipFilePath })
        } catch (err) {
          console.error(`[export-zip]: Fichier local introuvable ou inaccessible : ${localPath}`)
        }
      }
    }

    // 8. Finaliser l'archive (fermer le flux d'écriture)
    await archive.finalize()

  } catch (error: any) {
    console.error('[export-route-error]:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: error.message })
    }
  }
})

export default router
