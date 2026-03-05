import type { CachePayload } from './types';

const CACHE_KEY = 'helm:tasks';
const CACHE_TTL = 25 * 60 * 60; // 25 hours in seconds

// Dev fallback: in-memory cache on globalThis
const globalForCache = globalThis as typeof globalThis & {
  __helmCache?: Map<string, { value: unknown; expires: number }>;
};

function getDevCache(): Map<string, { value: unknown; expires: number }> {
  if (!globalForCache.__helmCache) {
    globalForCache.__helmCache = new Map();
  }
  return globalForCache.__helmCache;
}

function isVercelKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKV(): Promise<typeof import('@vercel/kv').kv | null> {
  if (!isVercelKV()) return null;
  const { kv } = await import('@vercel/kv');
  return kv;
}

export async function getCachedTasks(): Promise<CachePayload | null> {
  const kv = await getKV();

  if (kv) {
    return kv.get<CachePayload>(CACHE_KEY);
  }

  // Dev fallback
  const cache = getDevCache();
  const entry = cache.get(CACHE_KEY);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(CACHE_KEY);
    return null;
  }
  return entry.value as CachePayload;
}

export async function setCachedTasks(payload: CachePayload): Promise<void> {
  const kv = await getKV();

  if (kv) {
    await kv.set(CACHE_KEY, payload, { ex: CACHE_TTL });
    return;
  }

  // Dev fallback
  const cache = getDevCache();
  cache.set(CACHE_KEY, {
    value: payload,
    expires: Date.now() + CACHE_TTL * 1000,
  });
}

export async function invalidateCache(): Promise<void> {
  const kv = await getKV();

  if (kv) {
    await kv.del(CACHE_KEY);
    return;
  }

  const cache = getDevCache();
  cache.delete(CACHE_KEY);
}

export async function getCacheMeta(): Promise<{
  lastSynced: number;
  taskCount: number;
} | null> {
  const cached = await getCachedTasks();
  if (!cached) return null;
  return {
    lastSynced: cached.lastSynced,
    taskCount: cached.taskCount,
  };
}
