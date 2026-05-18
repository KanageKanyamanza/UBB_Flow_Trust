import type { Request, Response, NextFunction } from 'express'
import { ConsentGrantService } from '../services/consent-grant.service.js'

export interface ConsentGrantRequest extends Request {
  consentGrant?: {
    id: string
    partnerName: string
    purpose: string
    scope: string
    orgId: string
    expiresAt: Date
  }
}

/**
 * Middleware qui vérifie la présence et la validité du token temporaire de consentement (JWT).
 */
export const hasValidConsent = async (req: ConsentGrantRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No consent token provided' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' })
    }

    const grant = await ConsentGrantService.verifyToken(token)
    req.consentGrant = grant
    next()
  } catch (error: any) {
    return res.status(401).json({ error: `Unauthorized: ${error.message}` })
  }
}

/**
 * Middleware qui vérifie que le token de consentement possède le scope requis.
 */
export const requireConsentScope = (requiredScope: string) => {
  return (req: ConsentGrantRequest, res: Response, next: NextFunction) => {
    if (!req.consentGrant) {
      return res.status(401).json({ error: 'Unauthorized: No consent grant found' })
    }

    // Séparateur d'espace ou virgule pour les scopes
    const scopes = req.consentGrant.scope.split(/\s+|,/).map(s => s.trim().toLowerCase())
    if (!scopes.includes(requiredScope.trim().toLowerCase())) {
      return res.status(403).json({ error: `Forbidden: Missing required scope '${requiredScope}'` })
    }

    next()
  }
}
