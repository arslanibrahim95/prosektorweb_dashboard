type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 2000;

function sweepExpiredEntries(now: number): void {
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  }
}

function ensureCapacity(now: number): void {
  if (cacheStore.size < MAX_CACHE_ENTRIES) return;

  sweepExpiredEntries(now);
  if (cacheStore.size < MAX_CACHE_ENTRIES) return;

  // Remove oldest entries if still above cap.
  const toRemove = cacheStore.size - MAX_CACHE_ENTRIES + 1;
  let removed = 0;
  for (const key of cacheStore.keys()) {
    cacheStore.delete(key);
    removed += 1;
    if (removed >= toRemove) break;
  }
}

export function getCachedValue<T>(key: string): T | undefined {
  const now = Date.now();
  const entry = cacheStore.get(key);

  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    cacheStore.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlSeconds: number): void {
  const now = Date.now();
  ensureCapacity(now);
  cacheStore.set(key, {
    value,
    expiresAt: now + ttlSeconds * 1000,
  });
}

export async function getOrSetCachedValue<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = getCachedValue<T>(key);
  if (cached !== undefined) return cached;

  const loaded = await loader();
  setCachedValue(key, loaded, ttlSeconds);
  return loaded;
}
