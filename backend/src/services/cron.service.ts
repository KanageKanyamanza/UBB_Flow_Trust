import cron from 'node-cron'
import { AlertService } from './alert.service.js'

export class CronService {
  static init() {
    console.log('[cron]: Initializing background jobs...')

    // Run every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
      try {
        await AlertService.checkAllThresholds()
      } catch (error) {
        console.error('[cron]: Error running AlertService.checkAllThresholds:', error)
      }
    })

    // Run a quick check on startup (delayed to ensure DB is ready)
    setTimeout(async () => {
      console.log('[cron]: Running initial threshold check...')
      try {
        await AlertService.checkAllThresholds()
      } catch (error) {
        console.error('[cron]: Initial threshold check failed:', error)
      }
    }, 10000)
    
    console.log('[cron]: Scheduled AlertJob for 08:00 daily.')
  }
}
