import { Redis } from 'ioredis'

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy(times: number) {
    if (times > 3) {
      console.warn('[redis]: Disabling retries, redis is down.');
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  }
});

redisClient.on('error', (_err: Error) => {
  // console.error('[redis]: Connection error', err.message);
});

export class RedisService {
  static isConnected(): boolean {
    return redisClient.status === 'ready';
  }

  static async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected()) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      // ignore
    }
  }

  static async del(key: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      // ignore
    }
  }

  /**
   * Invalide toutes les clés correspondant à un pattern (ex: 'txns:orgId123:')
   * Utilise SCAN pour éviter de bloquer le serveur Redis.
   */
  static async getStats(): Promise<Record<string, string | number>> {
    if (!this.isConnected()) return { status: 'down' }
    try {
      const info = await redisClient.info()
      const parse = (key: string): string => {
        const match = info.match(new RegExp(`${key}:(.+)`))
        return match?.[1]?.trim() ?? 'N/A'
      }

      // Count total keys across all DBs
      const keyspaceSection = info.match(/# Keyspace([\s\S]*?)(?:\n#|$)/)?.[1] ?? ''
      const totalKeys = (keyspaceSection.match(/keys=(\d+)/g) ?? [])
        .reduce((sum, m) => sum + parseInt(m.replace('keys=', ''), 10), 0)

      return {
        status: 'up',
        version: parse('redis_version'),
        usedMemory: parse('used_memory_human'),
        peakMemory: parse('used_memory_peak_human'),
        connectedClients: Number(parse('connected_clients')),
        uptimeInSeconds: Number(parse('uptime_in_seconds')),
        totalKeys,
        hitRate: parse('keyspace_hits'),
        missRate: parse('keyspace_misses'),
      }
    } catch {
      return { status: 'error' }
    }
  }

  static async flushAll(): Promise<void> {
    if (!this.isConnected()) return
    await redisClient.flushall()
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected()) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', `${pattern}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      // ignore
    }
  }
}
