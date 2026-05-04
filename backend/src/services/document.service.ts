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

    // Delete files from storage
    for (const version of doc.versions) {
      await storageService.deleteFile(version.fileUrl)
    }

    // Delete versions first then document (Prisma doesn't always handle cascade delete on all adapters)
    await prisma.documentVersion.deleteMany({ where: { docId } })
    return await prisma.document.delete({ where: { id: docId } })
  }
}
