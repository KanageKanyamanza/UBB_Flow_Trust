import type { Response } from 'express'
import prisma from '../../config/prisma.js'
import { RedisService } from '../../services/redis.service.js'
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
}
