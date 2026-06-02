import prisma from '../config/prisma.js'
import { storageService } from './storage.service.js'
import { scoreQueue } from './score-queue.service.js'

export class DocumentService {
  static async createDocument(orgId: string, data: any, file: any) {
    const { type, name, validUntil } = data

    const fileUrl = await storageService.storeFile(file.buffer, file.originalname, file.mimetype)

    const document = await prisma.document.create({
      data: {
        type,
        name,
        orgId,
        versions: {
          create: {
            fileUrl,
            fileName: file.originalname,
            fileSize: file.size,
            validUntil: validUntil ? new Date(validUntil) : null,
          }
        }
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    // Déclenche un recalcul asynchrone du score après upload
    scoreQueue.enqueue(orgId)

    return document
  }

  static async listDocuments(orgId: string, type?: string) {
    return await prisma.document.findMany({
      where: { 
        orgId,
        ...(type ? { type } : {})
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  static async addVersion(docId: string, orgId: string, file: any, validUntil?: string) {
    // Verify ownership
    const doc = await prisma.document.findFirst({
      where: { id: docId, orgId }
    })

    if (!doc) throw new Error('Document not found')

    const fileUrl = await storageService.storeFile(file.buffer, file.originalname, file.mimetype)

    const version = await prisma.documentVersion.create({
      data: {
        docId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        validUntil: validUntil ? new Date(validUntil) : null,
      }
    })

    // Déclenche un recalcul du score après ajout d'une nouvelle version
    scoreQueue.enqueue(orgId)

    return version
  }

  static async deleteDocument(docId: string, orgId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: docId, orgId },
      include: { versions: true }
    })

    if (!doc) throw new Error('Document not found')

    if (doc.status !== 'DRAFT') {
      throw new Error('Seuls les documents au statut DRAFT peuvent être supprimés pour garantir l\'immutabilité.')
    }

    // Delete files from storage
    for (const version of doc.versions) {
      await storageService.deleteFile(version.fileUrl)
    }

    // Delete versions first then document (Prisma doesn't always handle cascade delete on all adapters)
    await prisma.documentVersion.deleteMany({ where: { docId } })
    return await prisma.document.delete({ where: { id: docId } })
  }

  static async checkExpirations() {
    const documents = await prisma.document.findMany({
      where: {
        status: {
          not: 'EXPIRED'
        }
      },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    const now = new Date()
    let expiredCount = 0

    for (const doc of documents) {
      const latestVersion = doc.versions[0]
      if (latestVersion && latestVersion.validUntil && latestVersion.validUntil < now) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { status: 'EXPIRED' }
        })

        // Create an alert to notify that document expiration impacts the score
        await prisma.alert.create({
          data: {
            orgId: doc.orgId,
            severity: 'CRITICAL',
            type: 'DOCUMENT_EXPIRED',
            message: `Alerte : Le document "${doc.name}" (${doc.type.replace(/_/g, ' ')}) a expiré, ce qui diminue votre Trust Score. Veuillez uploader une nouvelle version.`,
            isAck: false
          }
        })

        // Déclenche un recalcul du score car l'expiration impacte les points Documents
        scoreQueue.enqueue(doc.orgId)

        expiredCount++
      }
    }

    console.log(`[document-job]: Checked documents. Marked ${expiredCount} as EXPIRED.`)
    return expiredCount
  }

  static async getConsultationLogs(orgId: string) {
    return await prisma.auditLog.findMany({
      where: {
        orgId,
        action: {
          in: [
            'PARTNER_LIST_DOCUMENTS',
            'PARTNER_DOWNLOAD_DOCUMENT',
            'PARTNER_VIEW_PROFILE',
            'PARTNER_VIEW_TRANSACTIONS',
            'PARTNER_VIEW_TRUST_SCORE',
            'PARTNER_VIEW_ACCOUNTS'
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}
