/**
 * Shared in-memory cache with TTL and size limit
 * Used by both apiClient.ts and API routes
 */

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_SIZE = 500;

interface CacheEntry {
  data: unknown;
  expires: number;
}

const store = new Map<string, CacheEntry>();

/** Remove all expired entries */
function purgeExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expires) store.delete(key);
  }
}

/** Evict oldest 25% of entries when over limit */
function evictOldest(): void {
  const toRemove = Math.ceil(store.size * 0.25);
  const keys = store.keys();
  for (let i = 0; i < toRemove; i++) {
    const next = keys.next();
    if (next.done) break;
    store.delete(next.value);
  }
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { store.delete(key); return null; }
  return entry.data as T;
}

export function cacheSet(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS): void {
  if (store.size >= MAX_SIZE) {
    purgeExpired();
    if (store.size >= MAX_SIZE) evictOldest();
  }
  store.set(key, { data, expires: Date.now() + ttlMs });
}
