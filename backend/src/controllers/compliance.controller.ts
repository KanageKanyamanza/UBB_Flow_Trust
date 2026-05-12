import type { Request, Response } from 'express'
import { ComplianceService } from '../services/compliance.service.js'

export class ComplianceController {
  static async start(req: Request, res: Response) {
    try {
      const { market } = req.body
      if (!market) {
        return res.status(400).json({ error: 'Market is required' })
      }

      // req.user is populated by auth middleware
      const orgId = (req as any).user.orgId
      
      const checklist = await ComplianceService.startJourney(orgId, market)
      res.status(201).json(checklist)
    } catch (error: any) {
      console.error('[ComplianceController] Error starting journey:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const orgId = (req as any).user.orgId
      const checklist = await ComplianceService.getJourney(orgId)
      
      if (!checklist) {
        return res.status(404).json({ error: 'No compliance journey found' })
      }

      res.json(checklist)
    } catch (error: any) {
      console.error('[ComplianceController] Error getting journey:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
