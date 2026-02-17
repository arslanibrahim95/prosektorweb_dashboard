/**
 * In-memory cache with O(1) LRU eviction and memory-based limits
 *
 * Uses a doubly-linked list with a Map for O(1) get/set/delete/evict operations.
 * Previous implementation used Array.indexOf + splice which was O(n).
 *
 * SECURITY FIXES:
 * - Memory-based eviction prevents cache from consuming all available RAM
 * - Entry size tracking for accurate memory accounting
 * - TTL clamping enforced at all entry points
 * - Configurable memory limits
 */

// === Configuration ===

interface CacheConfig {
  maxEntries: number;
  maxMemoryBytes: number;
  defaultTtlSeconds: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxEntries: 2000,
  maxMemoryBytes: 100 * 1024 * 1024, // 100MB default
  defaultTtlSeconds: 300, // 5 minutes
};

// SECURITY: TTL bounds to prevent cache poisoning with extreme values
const MIN_CACHE_TTL_SEC = 1;
const MAX_CACHE_TTL_SEC = 86400; // 1 day

function clampTtl(ttlSeconds: number): number {
  return Math.max(MIN_CACHE_TTL_SEC, Math.min(ttlSeconds, MAX_CACHE_TTL_SEC));
}

// === Types ===

interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt: number;
  sizeBytes: number; // SECURITY: Track memory usage per entry
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  currentMemoryBytes: number;
  maxMemoryBytes: number;
  hitRate: number;
  missRate: number;
}

// === Doubly-linked list node for O(1) LRU ===
interface LRUNode<T = unknown> {
  key: string;
  entry: CacheEntry<T>;
  prev: LRUNode | null;
  next: LRUNode | null;
}

class CacheStore {
  private store = new Map<string, LRUNode>();
  private config: CacheConfig;
  private currentMemoryBytes = 0;

  // Cache statistics
  private hits = 0;
  private misses = 0;

  // Sentinel nodes for O(1) head/tail access
  private head: LRUNode;
  private tail: LRUNode;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create sentinel nodes (dummy head/tail)
    this.head = { key: '', entry: null as unknown as CacheEntry, prev: null, next: null };
    this.tail = { key: '', entry: null as unknown as CacheEntry, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Estimates memory size of a value in bytes
   * SECURITY: Rough estimate to prevent memory exhaustion
   */
  private estimateSize(value: unknown): number {
    try {
      const serialized = JSON.stringify(value);
      // UTF-8 encoding: 1 byte per ASCII char, up to 4 bytes for Unicode
      return Buffer.byteLength(serialized, 'utf8');
    } catch {
      // If we can't serialize, assume a reasonable size
      return 1024;
    }
  }

  /**
   * Gets a value from cache with LRU update
   */
  get<T>(key: string): T | undefined {
    const node = this.store.get(key);
    if (!node) {
      this.misses++;
      return undefined;
    }

    const now = Date.now();
    if (node.entry.expiresAt <= now) {
      this.removeNode(node);
      this.store.delete(key);
      this.currentMemoryBytes -= node.entry.sizeBytes;
      this.misses++;
      return undefined;
    }

    // Update last accessed and move to most-recently-used (tail end)
    node.entry.lastAccessed = now;
    this.removeNode(node);
    this.addToTail(node);
    this.hits++;

    return node.entry.value as T;
  }

  /**
   * Sets a value in cache with memory management
   * SECURITY: Enforces TTL clamping and memory limits
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    // SECURITY: Clamp TTL to prevent cache poisoning
    const clampedTtlMs = clampTtl(ttlMs / 1000) * 1000;
    const sizeBytes = this.estimateSize(value);

    // SECURITY: Check if single entry exceeds max memory
    if (sizeBytes > this.config.maxMemoryBytes) {
      console.warn(`[Cache] Entry size (${sizeBytes} bytes) exceeds max memory limit (${this.config.maxMemoryBytes} bytes). Entry not cached.`);
      return;
    }

    const now = Date.now();
    const existing = this.store.get(key);

    if (existing) {
      // Update existing node
      this.currentMemoryBytes -= existing.entry.sizeBytes;
      existing.entry.value = value;
      existing.entry.expiresAt = now + clampedTtlMs;
      existing.entry.sizeBytes = sizeBytes;
      existing.entry.lastAccessed = now;
      this.currentMemoryBytes += sizeBytes;
      this.removeNode(existing);
      this.addToTail(existing);
      return;
    }

    // SECURITY: Evict entries until we have enough memory
    while (
      this.store.size >= this.config.maxEntries ||
      (this.currentMemoryBytes + sizeBytes > this.config.maxMemoryBytes && this.store.size > 0)
    ) {
      this.evictOldest(1);
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: now + clampedTtlMs,
      sizeBytes,
      lastAccessed: now,
    };

    const node: LRUNode<T> = {
      key,
      entry,
      prev: null,
      next: null,
    };

    this.store.set(key, node as LRUNode);
    this.addToTail(node as LRUNode);
    this.currentMemoryBytes += sizeBytes;
  }

  /**
   * Deletes a key from cache
   */
  delete(key: string): boolean {
    const node = this.store.get(key);
    if (node) {
      this.removeNode(node);
      this.store.delete(key);
      this.currentMemoryBytes -= node.entry.sizeBytes;
      return true;
    }
    return false;
  }

  /**
   * Clears all entries from cache
   */
  clear(): void {
    this.store.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.currentMemoryBytes = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Returns all cache keys (for admin operations)
   */
  keys(): IterableIterator<string> {
    return this.store.keys();
  }

  /**
   * Returns cache entries sorted by last access time (oldest first)
   */
  getEntries(): Array<{ key: string; sizeBytes: number; lastAccessed: number; expiresAt: number }> {
    const entries: Array<{ key: string; sizeBytes: number; lastAccessed: number; expiresAt: number }> = [];
    let current = this.head.next;
    while (current && current !== this.tail) {
      entries.push({
        key: current.entry.key,
        sizeBytes: current.entry.sizeBytes,
        lastAccessed: current.entry.lastAccessed,
        expiresAt: current.entry.expiresAt,
      });
      current = current.next;
    }
    return entries;
  }

  /**
   * Evicts oldest N entries
   */
  private evictOldest(count: number): void {
    for (let i = 0; i < count && this.store.size > 0; i++) {
      const oldest = this.head.next;
      if (!oldest || oldest === this.tail) break;
      this.removeNode(oldest);
      this.store.delete(oldest.key);
      this.currentMemoryBytes -= oldest.entry.sizeBytes;
    }
  }

  // O(1) linked list operations
  private removeNode(node: LRUNode): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
  }

  private addToTail(node: LRUNode): void {
    const prev = this.tail.prev!;
    prev.next = node;
    node.prev = prev;
    node.next = this.tail;
    this.tail.prev = node;
  }

  /**
   * Returns cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxSize: this.config.maxEntries,
      currentMemoryBytes: this.currentMemoryBytes,
      maxMemoryBytes: this.config.maxMemoryBytes,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
    };
  }
}

// === Singleton Management ===

// Lazy initialization with configuration support
let cacheInstance: CacheStore | null = null;

function getCacheInstance(config?: Partial<CacheConfig>): CacheStore {
  if (!cacheInstance) {
    cacheInstance = new CacheStore(config);
  }
  return cacheInstance;
}

/**
 * Initialize cache with custom configuration
 * Should be called at app startup
 */
export function initializeCache(config?: Partial<CacheConfig>): void {
  if (cacheInstance) {
    console.warn('[Cache] Cache already initialized, ignoring new config');
    return;
  }
  cacheInstance = new CacheStore(config);
}

// === Public API ===

export function getCachedValue<T>(key: string): T | undefined {
  const cache = getCacheInstance();
  return cache.get<T>(key);
}

export function setCachedValue<T>(key: string, value: T, ttlSeconds: number): void {
  const cache = getCacheInstance();
  cache.set(key, value, clampTtl(ttlSeconds) * 1000);
}

// In-flight request tracker for cache stampede protection
// Prevents thundering herd by ensuring only one request loads a given key at a time
const inFlightRequests = new Map<string, Promise<unknown>>();

// SECURITY FIX: Add timeout to prevent stuck promises from blocking cache forever
const IN_FLIGHT_TIMEOUT_MS = 30000; // 30 seconds max per key

export async function getOrSetCachedValue<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  timeoutMs: number = 30000,
): Promise<T> {
  const cache = getCacheInstance();
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;

  // Cache Stampede Protection:
  // Use a Map to track in-flight requests for the same key.
  // This prevents multiple concurrent requests from hitting the loader function
  // when cache is empty (thundering herd problem).
  const pending = inFlightRequests.get(key);
  if (pending) {
    // Another request is already loading this key - wait for it
    return pending as Promise<T>;
  }

  // Create the promise and store it
  const loadPromise = (async () => {
    try {
      // Create a timeout promise that rejects after timeoutMs
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error(`Loader timeout after ${timeoutMs}ms`));
        }, timeoutMs);
        if (typeof id === 'object' && 'unref' in id) {
          (id as any).unref();
        }
      });

      // Race the loader against the timeout
      const loaded = await Promise.race([loader(), timeoutPromise]);
      cache.set(key, loaded, clampTtl(ttlSeconds) * 1000);
      return loaded;
    } finally {
      // Always clean up the in-flight request
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, loadPromise);
  return loadPromise;
}

export function deleteCachedValue(key: string): boolean {
  const cache = getCacheInstance();
  return cache.delete(key);
}

export function clearCacheStore(): number {
  const cache = getCacheInstance();
  const stats = cache.getStats();
  const size = stats.size;
  cache.clear();
  return size;
}

export function getCacheStats(): CacheStats {
  return getCacheInstance().getStats();
}

export function getCacheEntries(): Array<{ key: string; sizeBytes: number; lastAccessed: number; expiresAt: number }> {
  return getCacheInstance().getEntries();
}

export const MAX_CACHE_ENTRIES = DEFAULT_CONFIG.maxEntries;
export const MAX_CACHE_MEMORY_BYTES = DEFAULT_CONFIG.maxMemoryBytes;

/** Exposed cache store for admin operations (selective key deletion, etc.) */
export const cacheStore = {
  keys(): IterableIterator<string> {
    return getCacheInstance().keys();
  },
  delete(key: string): boolean {
    return getCacheInstance().delete(key);
  },
  getStats(): CacheStats {
    return getCacheInstance().getStats();
  },
  getEntries() {
    return getCacheInstance().getEntries();
  },
};
