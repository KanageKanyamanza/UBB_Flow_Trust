import { Router } from 'express'
import { AlertService } from '../services/alert.service.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const router = Router()

// All alert routes are protected
router.use(isAuthenticated)

router.get('/', async (req, res) => {
  try {
    const orgId = (req as any).user.orgId
    const alerts = await AlertService.getActiveAlerts(orgId)
    res.json(alerts)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/acknowledge', async (req, res) => {
  try {
    const orgId = (req as any).user.orgId
    const alertId = req.params.id
    await AlertService.acknowledgeAlert(alertId, orgId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
