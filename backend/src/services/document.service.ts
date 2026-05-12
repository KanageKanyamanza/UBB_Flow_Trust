import prisma from '../config/prisma.js'
import { storageService } from './storage.service.js'

export class DocumentService {
  static async createDocument(orgId: string, data: any, file: any) {
    const { type, name, validUntil } = data

    const fileUrl = await storageService.storeFile(file.buffer, file.originalname, file.mimetype)

    return await prisma.document.create({
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

    return await prisma.documentVersion.create({
      data: {
        docId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        validUntil: validUntil ? new Date(validUntil) : null,
      }
    })
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
        expiredCount++
      }
    }

    console.log(`[document-job]: Checked documents. Marked ${expiredCount} as EXPIRED.`)
    return expiredCount
  }
}
