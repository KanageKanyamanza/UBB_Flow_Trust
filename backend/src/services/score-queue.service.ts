import { EventEmitter } from 'events'
import { TrustService } from './trust.service.js'

/**
 * ScoreQueue — File d'attente in-process pour le recalcul asynchrone du Trust Score.
 *
 * Fonctionnement :
 * - Les événements de recalcul sont empilés dans une file (FIFO).
 * - Un seul job est traité à la fois pour éviter la contention en base.
 * - Le dédoublonnage empêche d'empiler plusieurs jobs pour le même orgId.
 * - L'API répond immédiatement (202 Accepted) sans attendre le calcul.
 */
class ScoreQueue extends EventEmitter {
  private queue: string[] = []
  private pending: Set<string> = new Set()
  private isProcessing = false

  constructor() {
    super()
    this.on('enqueue', () => this.processNext())
  }

  /**
   * Ajoute un orgId à la file d'attente.
   * Si un job pour cet orgId est déjà en attente, on ignore (dédoublonnage).
   */
  enqueue(orgId: string): void {
    if (this.pending.has(orgId)) {
      console.log(`[score-queue]: Job already queued for org ${orgId}, skipping.`)
      return
    }
    this.pending.add(orgId)
    this.queue.push(orgId)
    console.log(`[score-queue]: Enqueued recalculation for org ${orgId}. Queue size: ${this.queue.length}`)
    this.emit('enqueue')
  }

  /**
   * Traite le prochain job de la file de manière séquentielle.
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true
    const orgId = this.queue.shift()!
    this.pending.delete(orgId)

    console.log(`[score-queue]: Processing score recalculation for org ${orgId}...`)

    try {
      const result = await TrustService.calculateScore(orgId)
      console.log(`[score-queue]: ✅ Score recalculated for org ${orgId}: ${result.score}/100`)
    } catch (error: any) {
      console.error(`[score-queue]: ❌ Failed to recalculate score for org ${orgId}:`, error.message)
    } finally {
      this.isProcessing = false
      // Traiter le job suivant s'il y en a un
      if (this.queue.length > 0) {
        this.processNext()
      }
    }
  }

  /**
   * Retourne des métriques sur l'état de la file (utile pour /health).
   */
  getStats() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      pendingOrgs: Array.from(this.pending),
    }
  }
}

// Singleton partagé dans tout le processus Node.js
export const scoreQueue = new ScoreQueue()
