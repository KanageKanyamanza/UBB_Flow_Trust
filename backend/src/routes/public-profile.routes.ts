import { Router } from 'express'
import prisma from '../config/prisma.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router: ReturnType<typeof Router> = Router()

/**
 * GET /public/:slug
 * Route entièrement publique — aucune authentification requise.
 * Retourne le profil public d'une PME vérifiée si isActive === true.
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const publicProfile = await prisma.publicProfile.findUnique({
      where: { slug }
    })

    if (!publicProfile || !publicProfile.isActive) {
      return res.status(404).json({ error: 'Profil public introuvable ou désactivé.' })
    }

    // Récupérer le profil SME + bénéficiaires effectifs
    const smeProfile = await prisma.smeProfile.findUnique({
      where: { orgId: publicProfile.orgId },
      include: {
        beneficialOwners: {
          select: { name: true, role: true, ownershipPct: true }
        }
      }
    })

    // Récupérer le dernier score de confiance
    const latestScore = await prisma.trustScore.findFirst({
      where: { orgId: publicProfile.orgId },
      orderBy: { createdAt: 'desc' },
      select: { score: true, createdAt: true }
    })

    // Calculer le grade à partir du score
    const getGrade = (score: number) => {
      if (score >= 90) return 'AAA'
      if (score >= 80) return 'AA'
      if (score >= 70) return 'A'
      if (score >= 60) return 'BBB'
      if (score >= 50) return 'BB'
      return 'B'
    }

    res.json({
      slug: publicProfile.slug,
      isActive: publicProfile.isActive,
      publishedAt: publicProfile.createdAt,
      company: {
        legalName: smeProfile?.legalName,
        industry: smeProfile?.industry,
        country: smeProfile?.country,
        address: smeProfile?.address,
        website: smeProfile?.website,
        description: smeProfile?.description,
        foundedDate: smeProfile?.foundedDate,
        employeeCount: smeProfile?.employeeCount,
        beneficialOwners: smeProfile?.beneficialOwners ?? []
      },
      trust: latestScore
        ? {
            score: latestScore.score,
            grade: getGrade(latestScore.score),
            calculatedAt: latestScore.createdAt
          }
        : null
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /public/setup
 * Crée ou met à jour le profil public de l'organisation connectée.
 * Requiert une authentification (OWNER).
 */
router.post('/setup', isAuthenticated, async (req: any, res) => {
  try {
    const orgId = req.user.orgId
    const { slug, isActive } = req.body

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Un slug valide est requis.' })
    }

    // Vérifier que le slug est disponible (sauf si c'est le nôtre)
    const existing = await prisma.publicProfile.findUnique({ where: { slug } })
    if (existing && existing.orgId !== orgId) {
      return res.status(409).json({ error: 'Ce slug est déjà utilisé par une autre organisation.' })
    }

    const profile = await prisma.publicProfile.upsert({
      where: { orgId },
      update: { slug, isActive: isActive ?? true },
      create: { orgId, slug, isActive: isActive ?? true }
    })

    res.json(profile)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /public/me/status
 * Retourne le statut du profil public de l'organisation connectée.
 */
router.get('/me/status', isAuthenticated, async (req: any, res) => {
  try {
    const profile = await prisma.publicProfile.findUnique({
      where: { orgId: req.user.orgId }
    })
    res.json(profile ?? { isActive: false, slug: null })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
