import { Router } from 'express'
import { PushService } from '../services/push.service.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router: ReturnType<typeof Router> = Router()

/**
 * GET /push/vapid-public-key
 * Public route — the frontend needs the VAPID public key before the user
 * is necessarily authenticated (e.g. to register the push subscription).
 */
router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

// All routes below require authentication
router.use(isAuthenticated)

router.post('/subscribe', async (req, res) => {
  try {
    const userId = (req as any).user.id
    const subscription = req.body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Invalid push subscription payload' })
    }

    await PushService.saveSubscription(userId, subscription)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body
    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' })
    }

    await PushService.removeSubscription(endpoint)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
