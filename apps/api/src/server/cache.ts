import { getServerEnv } from './env';

// Use a class to allow potential swapping to Redis later
class CacheStore {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private maxEntries: number;
  private accessOrder: string[] = [];

  constructor(maxEntries: number = 2000) {
    this.maxEntries = maxEntries;
  }

  get(key: string): { value: unknown; expiresAt: number } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
      return undefined;
    }

    // Update LRU order
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);

    return entry;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    // Remove oldest entries if at capacity
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictOldest(1);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  delete(key: string): void {
    this.store.delete(key);
    this.removeFromAccessOrder(key);
  }

  clear(): void {
    this.store.clear();
    this.accessOrder = [];
  }

  private evictOldest(count: number): void {
    for (let i = 0; i < count && this.accessOrder.length > 0; i++) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.store.delete(oldest);
      }
    }
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  getStats() {
    return {
      size: this.store.size,
      maxSize: this.maxEntries,
    };
  }
}

// Lazy initialization to allow env to be loaded
let cacheInstance: CacheStore | null = null;

function getCacheInstance(): CacheStore {
  if (!cacheInstance) {
    // Use env config if available, otherwise use defaults
    try {
      const env = getServerEnv();
      cacheInstance = new CacheStore(2000);
    } catch {
      cacheInstance = new CacheStore(2000);
    }
  }
  return cacheInstance;
}

type CacheEntry<T> = T;

export function getCachedValue<T>(key: string): T | undefined {
  const cache = getCacheInstance();
  const entry = cache.get(key);
  return entry?.value as T | undefined;
}

export function setCachedValue<T>(key: string, value: T, ttlSeconds: number): void {
  const cache = getCacheInstance();
  cache.set(key, value, ttlSeconds * 1000);
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

export function clearCacheStore(): number {
  const cache = getCacheInstance();
  const size = cache.getStats().size;
  cache.clear();
  return size;
}

export function getCacheStats() {
  return getCacheInstance().getStats();
}

export const MAX_CACHE_ENTRIES = 2000;

/** Exposed cache store for admin operations (selective key deletion, etc.) */
export const cacheStore = {
  keys(): IterableIterator<string> {
    return (getCacheInstance() as any).store.keys();
  },
  delete(key: string): void {
    getCacheInstance().delete(key);
  },
};
