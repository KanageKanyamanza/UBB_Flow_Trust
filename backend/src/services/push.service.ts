import webpush from 'web-push'
import prisma from '../config/prisma.js'

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  url?: string
}

let configured = false

export class PushService {
  /**
   * Configure web-push with VAPID details. Safe to call multiple times.
   */
  static configure() {
    if (configured) return

    const publicKey = process.env.VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:contact@ubbflow.app'

    if (!publicKey || !privateKey) {
      console.warn('[push]: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY not set, push notifications disabled.')
      return
    }

    webpush.setVapidDetails(subject, publicKey, privateKey)
    configured = true
    console.log('[push]: Web push configured.')
  }

  /**
   * Save (or update) a push subscription for a user. Unique on endpoint.
   */
  static async saveSubscription(userId: string, subscription: PushSubscriptionPayload) {
    const { endpoint, keys } = subscription
    return prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    })
  }

  /**
   * Remove a push subscription by endpoint (e.g. on unsubscribe).
   */
  static async removeSubscription(endpoint: string) {
    try {
      await prisma.pushSubscription.delete({ where: { endpoint } })
    } catch (error) {
      // Already gone, ignore
    }
  }

  /**
   * Send a push notification to every subscribed device of a user.
   * Removes subscriptions that are no longer valid (404/410).
   */
  static async sendToUser(userId: string, payload: PushNotificationPayload) {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
    if (subscriptions.length === 0) return

    const data = JSON.stringify(payload)

    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          data
        )
      } catch (error: any) {
        const statusCode = error?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await PushService.removeSubscription(sub.endpoint)
        } else {
          console.error(`[push]: Failed to send notification to ${sub.endpoint}:`, error?.message || error)
        }
      }
    }))
  }

  /**
   * Send a push notification to every user of an organization.
   * Alerts are org-scoped, so we resolve the org's users first.
   */
  static async sendToOrg(orgId: string, payload: PushNotificationPayload) {
    const users = await prisma.user.findMany({
      where: { orgId },
      select: { id: true }
    })

    await Promise.all(users.map(user => PushService.sendToUser(user.id, payload)))
  }
}

// Configure VAPID details as soon as this module is loaded.
PushService.configure()
