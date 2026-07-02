import type { Response } from 'express'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

export class AdminAnalyticsController {
  static async overview(_req: AdminRequest, res: Response) {
    const [totalOrgs, totalUsers, pendingDocuments, avgScoreResult, criticalAlerts] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.document.count({ where: { status: 'SUBMITTED' } }),
      prisma.trustScore.aggregate({ _avg: { score: true } }),
      prisma.alert.count({ where: { severity: 'CRITICAL', isAck: false } }),
    ])

    res.json({
      totalOrgs,
      totalUsers,
      pendingDocuments,
      avgTrustScore: Math.round(avgScoreResult._avg.score ?? 0),
      criticalAlerts,
    })
  }

  static async registrations(_req: AdminRequest, res: Response) {
    const orgs = await prisma.organization.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Build last 12 months buckets
    const now = new Date()
    const buckets: Record<string, number> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = 0
    }

    for (const org of orgs) {
      const key = `${org.createdAt.getFullYear()}-${String(org.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (key in buckets) buckets[key] = (buckets[key] ?? 0) + 1
    }

    const data = Object.entries(buckets).map(([month, count]) => ({ month, count }))
    res.json(data)
  }

  static async documentsByStatus(_req: AdminRequest, res: Response) {
    const groups = await prisma.document.groupBy({
      by: ['status'],
      _count: { status: true },
    })
    const data = groups.map((g: any) => ({ status: g.status, count: g._count.status }))
    res.json(data)
  }

  static async trustDistribution(_req: AdminRequest, res: Response) {
    const allScores = await prisma.trustScore.findMany({
      orderBy: { createdAt: 'desc' },
      select: { orgId: true, score: true },
    })

    // Keep only the latest score per org
    const latestByOrg = new Map<string, number>()
    for (const s of allScores) {
      if (!latestByOrg.has(s.orgId)) latestByOrg.set(s.orgId, s.score)
    }
    const scores = Array.from(latestByOrg.values())

    const data = [
      { range: '0-20',   count: scores.filter((s) => s <= 20).length },
      { range: '21-40',  count: scores.filter((s) => s > 20 && s <= 40).length },
      { range: '41-60',  count: scores.filter((s) => s > 40 && s <= 60).length },
      { range: '61-80',  count: scores.filter((s) => s > 60 && s <= 80).length },
      { range: '81-100', count: scores.filter((s) => s > 80).length },
    ]
    res.json(data)
  }
}
