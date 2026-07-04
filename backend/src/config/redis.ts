import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.warn('[Redis] Max retries reached. Caching disabled.');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000);
  },
  enableOfflineQueue: false,
});

redis.on('connect', () => {
  console.log('[Redis] ✅ Connected successfully');
});

redis.on('error', (err: Error) => {
  // Log but don't crash — the app works without Redis (just slower)
  console.warn(`[Redis] ⚠️  Connection error: ${err.message}`);
});

export default redis;
