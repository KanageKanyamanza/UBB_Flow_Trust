import cron from 'node-cron'
import { AlertService } from './alert.service.js'
import { DocumentService } from './document.service.js'

export class CronService {
  static lastRun: Date | null = null
  static status: 'IDLE' | 'RUNNING' | 'FAILED' = 'IDLE'

  static init() {
    console.log('[cron]: Initializing background jobs...')

    // Run every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('[cron]: Running scheduled background jobs...')
      CronService.status = 'RUNNING'
      CronService.lastRun = new Date()
      try {
        await AlertService.checkAllThresholds()
        await DocumentService.checkExpirations()
        CronService.status = 'IDLE'
      } catch (error) {
        CronService.status = 'FAILED'
        console.error('[cron]: Error running background jobs:', error)
      }
    })

    // Run a quick check on startup (delayed to ensure DB is ready)
    setTimeout(async () => {
      console.log('[cron]: Running initial background checks...')
      CronService.status = 'RUNNING'
      CronService.lastRun = new Date()
      try {
        await AlertService.checkAllThresholds()
        await DocumentService.checkExpirations()
        CronService.status = 'IDLE'
      } catch (error) {
        CronService.status = 'FAILED'
        console.error('[cron]: Initial background checks failed:', error)
      }
    }, 10000)
    
    console.log('[cron]: Scheduled background jobs.')
  }
}
