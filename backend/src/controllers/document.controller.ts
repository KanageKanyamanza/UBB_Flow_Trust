import type { Response } from 'express'
import { DocumentService } from '../services/document.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

export class DocumentController {
  static async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' })

      const document = await DocumentService.createDocument(req.user.orgId, req.body, req.file)
      res.status(201).json(document)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const { type } = req.query as { type?: string }
      const documents = await DocumentService.listDocuments(req.user.orgId, type)
      res.json(documents)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async addVersion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' })
      
      const id = req.params.id as string
      const { validUntil } = req.body
      
      const version = await DocumentService.addVersion(id, req.user.orgId, req.file, validUntil)
      res.status(201).json(version)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const id = req.params.id as string
      await DocumentService.deleteDocument(id, req.user.orgId)
      res.status(204).send()
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }

  static async getLogs(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      const logs = await DocumentService.getConsultationLogs(req.user.orgId)
      res.json(logs)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
