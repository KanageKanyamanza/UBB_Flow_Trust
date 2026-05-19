import { Router } from 'express'
import {
  hasValidConsent,
  requireConsentScope,
  checkConsentGrantBola
} from '../middleware/consent-grant.middleware.js'
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
      include: {
        evidenceFiles: true
      }
    })

    res.json(transactions)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Endpoint pour récupérer une transaction spécifique avec BOLA renforcé.
 */
router.get(
  '/transactions/:id',
  requireConsentScope('transactions:read'),
  checkConsentGrantBola('transaction'),
  async (req: ConsentGrantRequest, res) => {
    try {
      const id = req.params.id as string
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          account: {
            select: {
              name: true,
              type: true,
              currency: true
            }
          },
          evidenceFiles: true
        }
      })
      res.json(transaction)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

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

/**
 * Endpoint pour lister les documents si le scope 'documents:read' est présent.
 */
router.get('/documents', requireConsentScope('documents:read'), async (req: ConsentGrantRequest, res) => {
  try {
    const orgId = req.consentGrant!.orgId
    const documents = await prisma.document.findMany({
      where: { orgId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    res.json(documents)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Endpoint pour récupérer un document spécifique avec BOLA renforcé.
 */
router.get(
  '/documents/:id',
  requireConsentScope('documents:read'),
  checkConsentGrantBola('document'),
  async (req: ConsentGrantRequest, res) => {
    try {
      const id = req.params.id as string
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
      res.json(document)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

/**
 * Endpoint pour lister les comptes bancaires si le scope 'accounts:read' ou 'transactions:read' est présent.
 */
router.get('/accounts', requireConsentScope(['accounts:read', 'transactions:read']), async (req: ConsentGrantRequest, res) => {
  try {
    const orgId = req.consentGrant!.orgId
    const accounts = await prisma.account.findMany({
      where: { orgId },
      orderBy: { name: 'asc' }
    })
    res.json(accounts)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Endpoint pour récupérer un compte spécifique avec BOLA renforcé.
 */
router.get(
  '/accounts/:id',
  requireConsentScope(['accounts:read', 'transactions:read']),
  checkConsentGrantBola('account'),
  async (req: ConsentGrantRequest, res) => {
    try {
      const id = req.params.id as string
      const account = await prisma.account.findUnique({
        where: { id }
      })
      res.json(account)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
)

export default router
