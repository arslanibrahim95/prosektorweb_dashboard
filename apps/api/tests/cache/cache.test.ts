import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    initializeCache,
    getCachedValue,
    setCachedValue,
    getOrSetCachedValue,
    deleteCachedValue,
    clearCacheStore,
    getCacheStats,
    cacheStore,
} from "@/server/cache";

describe("cache module", () => {
    beforeEach(() => {
        // Clear cache before each test
        clearCacheStore();
    });

    describe("CacheStore basic operations", () => {
        it("should initialize cache with default config", () => {
            initializeCache();
            const stats = getCacheStats();
            expect(stats.maxSize).toBe(2000);
            expect(stats.maxMemoryBytes).toBe(100 * 1024 * 1024);
        });

        it("should store and retrieve string values", () => {
            setCachedValue("test-key", "test-value", 60);
            const value = getCachedValue<string>("test-key");
            expect(value).toBe("test-value");
        });

        it("should store and retrieve object values", () => {
            const obj = { name: "test", count: 42 };
            setCachedValue("obj-key", obj, 60);
            const value = getCachedValue<typeof obj>("obj-key");
            expect(value).toEqual(obj);
        });

        it("should return undefined for non-existent keys", () => {
            const value = getCachedValue("non-existent");
            expect(value).toBeUndefined();
        });

        it("should delete values", () => {
            setCachedValue("delete-key", "value", 60);
            expect(getCachedValue("delete-key")).toBe("value");
            
            const deleted = deleteCachedValue("delete-key");
            expect(deleted).toBe(true);
            expect(getCachedValue("delete-key")).toBeUndefined();
        });

        it("should return false for deleting non-existent keys", () => {
            const deleted = deleteCachedValue("non-existent");
            expect(deleted).toBe(false);
        });

        it("should clear all cache entries", () => {
            setCachedValue("key1", "value1", 60);
            setCachedValue("key2", "value2", 60);
            
            expect(getCachedValue("key1")).toBe("value1");
            
            const cleared = clearCacheStore();
            expect(cleared).toBe(2);
            expect(getCachedValue("key1")).toBeUndefined();
            expect(getCachedValue("key2")).toBeUndefined();
        });

        it("should track cache statistics", () => {
            setCachedValue("key1", "value1", 60);
            getCachedValue("key1"); // hit
            getCachedValue("non-existent"); // miss
            
            const stats = getCacheStats();
            expect(stats.size).toBe(1);
            expect(stats.hitRate).toBeGreaterThan(0);
            expect(stats.missRate).toBeGreaterThan(0);
        });
    });

    describe("getOrSetCachedValue", () => {
        it("should return cached value if exists", async () => {
            setCachedValue("cached", "cached-value", 60);
            
            const result = await getOrSetCachedValue("cached", 60, async () => {
                return "should-not-be-called";
            });
            
            expect(result).toBe("cached-value");
        });

        it("should load value if not cached", async () => {
            const result = await getOrSetCachedValue("not-cached", 60, async () => {
                return "loaded-value";
            });
            
            expect(result).toBe("loaded-value");
            expect(getCachedValue("not-cached")).toBe("loaded-value");
        });
    });

    describe("cacheStore admin operations", () => {
        it("should list all cache keys", () => {
            setCachedValue("admin-key1", "value1", 60);
            setCachedValue("admin-key2", "value2", 60);
            
            const keys = Array.from(cacheStore.keys());
            expect(keys).toContain("admin-key1");
            expect(keys).toContain("admin-key2");
        });

        it("should get cache entries with metadata", () => {
            setCachedValue("entry-key", "entry-value", 60);
            
            const entries = cacheStore.getEntries();
            expect(entries.length).toBe(1);
            expect(entries[0].key).toBe("entry-key");
            expect(entries[0].sizeBytes).toBeGreaterThan(0);
            expect(entries[0].expiresAt).toBeGreaterThan(Date.now());
        });

        it("should delete via store interface", () => {
            setCachedValue("store-delete-key", "value", 60);
            
            const result = cacheStore.delete("store-delete-key");
            expect(result).toBe(true);
            expect(getCachedValue("store-delete-key")).toBeUndefined();
        });
    });
});
