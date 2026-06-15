import prisma from '../config/prisma.js'
import { AnalyticsService } from './analytics.service.js'
import { AlertSeverity } from '@prisma/client'
import { RedisService } from './redis.service.js'

export class AlertService {
  /**
   * Check all organizations for potential liquidity issues
   */
  static async checkAllThresholds() {
    console.log('[alert-job]: Starting threshold check for all organizations...')
    const organizations = await prisma.organization.findMany()

    const BATCH_SIZE = 10
    for (let i = 0; i < organizations.length; i += BATCH_SIZE) {
      const batch = organizations.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(org => 
        this.checkOrganizationThresholds(org.id).catch(err => {
          console.error(`[alert-job]: Error checking thresholds for org ${org.id}:`, err)
        })
      ))
    }
    console.log('[alert-job]: Threshold check completed.')
  }

  /**
   * Check a specific organization for threshold breaches
   */
  static async checkOrganizationThresholds(orgId: string) {
    const kpis = await AnalyticsService.getKpis(orgId)
    const projections = await AnalyticsService.getProjections(orgId)
    
    const DANGER_THRESHOLD = 500000 // 500k CFA
    const CRITICAL_THRESHOLD = 0

    // 1. Check current balance
    if (kpis.totalBalance <= CRITICAL_THRESHOLD) {
      await this.createAlert(orgId, 'CRITICAL', 'SOLDE_NUL', `Attention : Votre trésorerie est nulle ou négative (${new Intl.NumberFormat('fr-FR').format(kpis.totalBalance)} CFA). Action immédiate requise.`)
    } else if (kpis.totalBalance <= DANGER_THRESHOLD) {
      await this.createAlert(orgId, 'WARN', 'SOLDE_BAS', `Vigilance : Votre solde actuel (${new Intl.NumberFormat('fr-FR').format(kpis.totalBalance)} CFA) est passé sous le seuil de sécurité de 500k.`)
    }

    // 2. Check projections at 30 days
    const proj30 = projections.projections[30]
    if (proj30 <= CRITICAL_THRESHOLD) {
      await this.createAlert(orgId, 'CRITICAL', 'FORECAST_CRITICAL', `Alerte Rouge : Vos projections à 30 jours indiquent un solde négatif (${new Intl.NumberFormat('fr-FR').format(proj30)} CFA). Prévoyez un apport ou réduisez les charges.`)
    } else if (proj30 <= DANGER_THRESHOLD) {
      await this.createAlert(orgId, 'WARN', 'FORECAST_WARN', `Prévision : Votre solde projeté à 30 jours (${new Intl.NumberFormat('fr-FR').format(proj30)} CFA) risque de descendre sous le seuil de vigilance.`)
    }

    // 3. Check Runway
    if (kpis.runwayMonths < 1 && kpis.totalBalance > 0) {
      await this.createAlert(orgId, 'CRITICAL', 'RUNWAY_LOW', `Urgence : Votre autonomie financière (Runway) est estimée à moins d'un mois.`)
    }
  }

  private static async createAlert(orgId: string, severity: AlertSeverity, type: string, message: string) {
    // Check if an unacknowledged alert of the same type was created in the last 24h to avoid spam
    const lastAlert = await prisma.alert.findFirst({
      where: {
        orgId,
        type,
        isAck: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    if (lastAlert) return

    const created = await prisma.alert.create({
      data: {
        orgId,
        severity,
        type,
        message,
        isAck: false
      }
    })
    await RedisService.del(`alerts:${orgId}:active`)
    return created
  }

  static async getActiveAlerts(orgId: string) {
    const cacheKey = `alerts:${orgId}:active`
    const cached = await RedisService.get<any[]>(cacheKey)
    if (cached) return cached

    const result = await prisma.alert.findMany({
      where: {
        orgId,
        isAck: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    await RedisService.set(cacheKey, result, 60) // Cache 60s
    return result
  }

  static async acknowledgeAlert(alertId: string, orgId: string) {
    const result = await prisma.alert.updateMany({
      where: {
        id: alertId,
        orgId
      },
      data: {
        isAck: true
      }
    })
    // Invalide le cache des alertes
    await RedisService.del(`alerts:${orgId}:active`)
    return result
  }
}
