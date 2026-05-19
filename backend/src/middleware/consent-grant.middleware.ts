import type { Request, Response, NextFunction } from 'express'
import { ConsentGrantService } from '../services/consent-grant.service.js'
import prisma from '../config/prisma.js'

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
 * Middleware qui vérifie que le token de consentement possède les scopes requis.
 * Supporte un scope unique ou un tableau de scopes alternatifs (OR).
 * Supporte le wildcard '*' pour un accès total.
 */
export const requireConsentScope = (requiredScopes: string | string[]) => {
  return (req: ConsentGrantRequest, res: Response, next: NextFunction) => {
    if (!req.consentGrant) {
      return res.status(401).json({ error: 'Unauthorized: No consent grant found' })
    }

    // Normalisation des scopes du token
    const tokenScopes = req.consentGrant.scope
      .split(/\s+|,/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    // Wildcard '*' donne accès à tout
    if (tokenScopes.includes('*')) {
      return next()
    }

    // Normalisation des scopes requis
    const requiredList = (Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes])
      .map(s => s.trim().toLowerCase())

    // Vérifie si au moins un des scopes requis est présent dans les scopes du token (OR logic)
    const hasAccess = requiredList.some(reqScope => tokenScopes.includes(reqScope))

    if (!hasAccess) {
      return res.status(403).json({
        error: `Forbidden: Missing required scope. Allowed scopes for this route: [${requiredList.join(', ')}]`
      })
    }

    next()
  }
}

/**
 * Middleware de sécurité BOLA (Broken Object Level Authorization) renforcé.
 * Vérifie que la ressource identifiée par 'id' dans les paramètres de la requête
 * appartient bien à l'organisation liée au token de consentement.
 */
export const checkConsentGrantBola = (resourceType: 'transaction' | 'document' | 'account' | 'profile' | 'trust-score') => {
  return async (req: ConsentGrantRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.consentGrant) {
        return res.status(401).json({ error: 'Unauthorized: No consent grant found' })
      }

      const resourceId = req.params.id as string
      if (!resourceId) {
        return next() // S'il n'y a pas d'identifiant dans la requête, on laisse passer au contrôleur
      }

      const orgId = req.consentGrant.orgId
      let isOwner = false

      switch (resourceType) {
        case 'transaction': {
          const count = await prisma.transaction.count({
            where: { id: resourceId, orgId }
          })
          isOwner = count > 0
          break
        }
        case 'document': {
          const count = await prisma.document.count({
            where: { id: resourceId, orgId }
          })
          isOwner = count > 0
          break
        }
        case 'account': {
          const count = await prisma.account.count({
            where: { id: resourceId, orgId }
          })
          isOwner = count > 0
          break
        }
        case 'profile': {
          const count = await prisma.smeProfile.count({
            where: { id: resourceId, orgId }
          })
          isOwner = count > 0
          break
        }
        case 'trust-score': {
          const count = await prisma.trustScore.count({
            where: { id: resourceId, orgId }
          })
          isOwner = count > 0
          break
        }
        default:
          return res.status(500).json({ error: 'Internal Server Error: Invalid resource type for BOLA check' })
      }

      if (!isOwner) {
        return res.status(403).json({
          error: `Forbidden: Accès refusé à cette ressource. BOLA renforcé activé.`
        })
      }

      next()
    } catch (error: any) {
      return res.status(500).json({ error: `Erreur interne de vérification BOLA : ${error.message}` })
    }
  }
}
