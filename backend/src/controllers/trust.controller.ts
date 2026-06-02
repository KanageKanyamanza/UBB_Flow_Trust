import type { Response } from 'express'
import { TrustService } from '../services/trust.service.js'
import { scoreQueue } from '../services/score-queue.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

export class TrustController {
  /**
   * GET /trust/score
   * Retourne le score depuis le cache DB — non-bloquant, réponse instantanée.
   */
  static async getScore(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

      const score = await TrustService.getLatestScore(req.user.orgId)
      res.json(score)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  /**
   * POST /trust/score/refresh
   * Enfile un recalcul asynchrone et retourne 202 immédiatement.
   * L'API n'est pas bloquée — le score sera mis à jour en arrière-plan.
   */
  static async refreshScore(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

      // Récupère le dernier score connu pour l'inclure dans la réponse immédiate
      const lastScore = await TrustService.getLatestScore(req.user.orgId)

      // Enfile le recalcul en arrière-plan (non-bloquant)
      scoreQueue.enqueue(req.user.orgId)

      // Réponse immédiate 202 Accepted
      res.status(202).json({
        message: 'Score recalculation queued. The updated score will be available shortly.',
        queueStats: scoreQueue.getStats(),
        currentScore: lastScore
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}
