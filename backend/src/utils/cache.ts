import redis from '../config/redis';

/**
 * Fetch a value from the Redis cache.
 * Returns null on a cache miss OR if Redis is unavailable.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    // If Redis is down, treat it as a cache miss — never block the request
    return null;
  }
}

/**
 * Store a value in the Redis cache with a TTL (default: 60 seconds).
 * Silently fails if Redis is unavailable.
 */
export async function setCache<T>(key: string, data: T, ttlSeconds = 60): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // Silently ignore — a write failure is non-critical
  }
}

/**
 * Remove one or more specific keys from the cache.
 * Silently fails if Redis is unavailable.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Non-critical
  }
}

/**
 * Remove all keys matching a glob pattern (e.g., "courses:*").
 * Uses SCAN to avoid blocking the Redis server on large datasets.
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // Non-critical
  }
}
