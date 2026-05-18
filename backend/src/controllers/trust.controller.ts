import type { Response } from 'express'
import { TrustService } from '../services/trust.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

export class TrustController {
  static async getScore(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const score = await TrustService.getLatestScore(req.user.orgId)
      res.json(score)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async refreshScore(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const score = await TrustService.calculateScore(req.user.orgId)
      res.json(score)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
