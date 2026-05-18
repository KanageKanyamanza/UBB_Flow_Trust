import type { Response } from 'express'
import { ConsentGrantService } from '../services/consent-grant.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

export class ConsentGrantController {
  /**
   * Crée un nouvel accord de consentement et génère le token d'accès JWT associé.
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

      const { partnerName, purpose, scope, expiresAt } = req.body

      if (!partnerName || !purpose || !scope || !expiresAt) {
        return res.status(400).json({ error: 'Champs requis manquants : partnerName, purpose, scope, expiresAt' })
      }

      const expiresAtDate = new Date(expiresAt)
      if (isNaN(expiresAtDate.getTime())) {
        return res.status(400).json({ error: 'Format de date invalide pour expiresAt' })
      }

      const result = await ConsentGrantService.createConsentGrant(
        req.user.orgId,
        partnerName,
        purpose,
        scope,
        expiresAtDate
      )

      res.status(201).json(result)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }

  /**
   * Liste tous les accords de consentement d'une organisation.
   */
  static async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

      const grants = await ConsentGrantService.listConsentGrants(req.user.orgId)
      res.json(grants)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * Révoque un accord de consentement.
   */
  static async revoke(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

      const id = req.params.id as string
      if (!id) {
        return res.status(400).json({ error: 'ID de consentement requis' })
      }

      await ConsentGrantService.revokeConsentGrant(id, req.user.orgId)
      res.status(204).send()
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }
}
