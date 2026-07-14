import type { Response } from 'express'
import prisma from '../../config/prisma.js'
import { RedisService } from '../../services/redis.service.js'
import { CronService } from '../../services/cron.service.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

export class AdminSystemController {
  static async health(_req: AdminRequest, res: Response) {
    let dbStatus = 'up'
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      dbStatus = 'down'
    }

    res.json({
      status: dbStatus === 'up' && RedisService.isConnected() ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: { status: dbStatus },
      redis: { status: RedisService.isConnected() ? 'up' : 'down' },
    })
  }

  static async redisStats(_req: AdminRequest, res: Response) {
    const stats = await RedisService.getStats()
    res.json(stats)
  }

  static async flushCache(req: AdminRequest, res: Response) {
    await RedisService.flushAll()
    await prisma.auditLog.create({
      data: {
        action: 'CACHE_FLUSHED',
        entityType: 'System',
        entityId: 'redis',
        adminId: req.admin!.id,
      },
    })
    res.status(204).send()
  }

  static async cronStatus(_req: AdminRequest, res: Response) {
    const now = new Date()
    const nextRun = new Date(now)
    nextRun.setHours(8, 0, 0, 0)
    if (now.getHours() >= 8) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    res.json({
      jobs: [
        {
          name: 'Check Thresholds & Document Expirations',
          schedule: '0 8 * * *',
          lastRun: CronService.lastRun ? CronService.lastRun.toISOString() : null,
          nextRun: nextRun.toISOString(),
          status: CronService.status
        }
      ]
    })
  }
}
