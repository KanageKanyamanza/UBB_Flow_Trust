import { Router } from 'express'
import { hasValidConsent, requireConsentScope } from '../middleware/consent-grant.middleware.js'
import prisma from '../config/prisma.js'
import type { ConsentGrantRequest } from '../middleware/consent-grant.middleware.js'

const router = Router()

// Tous les appels partenaires doivent être vérifiés via le token de consentement
router.use(hasValidConsent)

/**
 * Endpoint pour récupérer le profil de l'entreprise si le scope 'profile:read' est présent.
 */
router.get('/profile', requireConsentScope('profile:read'), async (req: ConsentGrantRequest, res) => {
  try {
    const orgId = req.consentGrant!.orgId
    const profile = await prisma.smeProfile.findUnique({
      where: { orgId },
      include: { beneficialOwners: true },
    })

    if (!profile) {
      return res.status(404).json({ error: 'Profil PME introuvable pour cette organisation' })
    }

    res.json(profile)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Endpoint pour récupérer l'historique des transactions si le scope 'transactions:read' est présent.
 */
router.get('/transactions', requireConsentScope('transactions:read'), async (req: ConsentGrantRequest, res) => {
  try {
    const orgId = req.consentGrant!.orgId
    const transactions = await prisma.transaction.findMany({
      where: { orgId },
      orderBy: { occurredAt: 'desc' },
      take: 50, // Limite par sécurité pour un accès partenaire
    })

    res.json(transactions)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Endpoint pour récupérer le score de confiance si le scope 'trust:read' est présent.
 */
router.get('/trust-score', requireConsentScope('trust:read'), async (req: ConsentGrantRequest, res) => {
  try {
    const orgId = req.consentGrant!.orgId
    const score = await prisma.trustScore.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })

    if (!score) {
      return res.status(404).json({ error: 'Aucun score de confiance calculé pour cette organisation' })
    }

    res.json(score)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
