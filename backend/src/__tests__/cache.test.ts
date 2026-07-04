import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// Mock ioredis BEFORE importing our cache module
vi.mock('../config/redis', () => {
  const store = new Map<string, string>();
  return {
    default: {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => { store.set(key, value); return 'OK'; }),
      del: vi.fn(async (...keys: string[]) => { keys.forEach(k => store.delete(k)); return keys.length; }),
      scan: vi.fn(async () => ['0', []]),
    },
  };
});

import { getCache, setCache, invalidateCache } from '../utils/cache';

describe('Cache Utilities', () => {
  it('setCache stores a value and getCache retrieves it', async () => {
    await setCache('test:key1', { name: 'SmartLMS' }, 60);
    const result = await getCache<{ name: string }>('test:key1');
    expect(result).toEqual({ name: 'SmartLMS' });
  });

  it('getCache returns null for a missing key', async () => {
    const result = await getCache('non:existent:key');
    expect(result).toBeNull();
  });

  it('invalidateCache removes a key so getCache returns null', async () => {
    await setCache('test:key2', { value: 42 }, 60);
    await invalidateCache('test:key2');
    const result = await getCache('test:key2');
    expect(result).toBeNull();
  });

  it('setCache stores JSON-serialized complex objects', async () => {
    const obj = { users: [{ id: '1', name: 'Alice' }], total: 1 };
    await setCache('test:key3', obj, 60);
    const result = await getCache<typeof obj>('test:key3');
    expect(result?.users[0].name).toBe('Alice');
    expect(result?.total).toBe(1);
  });
});
