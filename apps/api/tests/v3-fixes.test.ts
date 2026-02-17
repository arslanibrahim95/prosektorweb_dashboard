import { describe, it, expect, beforeEach } from 'vitest';
import { getOrSetCachedValue, clearCacheStore } from '@/server/cache';
// accessing private members for testing
import { originDecisionCache, pruneCache, ORIGIN_CACHE_MAX_ENTRIES } from '@/server/security/origin';

import { parseInboxQueryParams } from '@/server/inbox/query-params';
import { baseInboxQuerySchema } from '@/server/inbox/base-schema';
import { HttpError } from '@/server/api/http';
import { z } from 'zod';

// Mock env for testing
process.env.ALLOWED_WEB_ORIGINS = 'https://example.com';

describe('V3 Code Review Fixes', () => {

    describe('1. Cache Race Condition (Timeout)', () => {
        beforeEach(() => {
            clearCacheStore();
        });

        it('should time out if loader takes too long', async () => {
            const key = 'timeout-test';
            const slowLoader = async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return 'slow-value';
            };

            await expect(getOrSetCachedValue(key, 60, slowLoader, 100)).rejects.toThrow(/timeout/i);
        });

        it('should clean up in-flight request map on timeout', async () => {
            const key = 'cleanup-test';
            const slowLoader = async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return 'slow-value';
            };

            try {
                await getOrSetCachedValue(key, 60, slowLoader, 50);
            } catch {
                // ignore timeout error
            }

            // Immediately try again with fast loader - should not be blocked
            const fastLoader = async () => 'fast-value';
            const result = await getOrSetCachedValue(key, 60, fastLoader, 1000);
            expect(result).toBe('fast-value');
        });
    });

    describe('2. Origin Memory Leak (Smart Pruning)', () => {
        beforeEach(() => {
            originDecisionCache.clear();
        });

        it('should prune expired entries first, then negative ones', () => {
            const now = Date.now();

            // 1. Add expired entries
            originDecisionCache.set('expired1.com', { allowed: false, expiresAt: now - 1000 });
            originDecisionCache.set('expired2.com', { allowed: true, expiresAt: now - 1000 });

            // 2. Add negative (denied) valid entries
            originDecisionCache.set('denied1.com', { allowed: false, expiresAt: now + 60000 });
            originDecisionCache.set('denied2.com', { allowed: false, expiresAt: now + 60000 });

            // 3. Add fresh positive entries to reach limit
            // We want total size > MAX to trigger pruning
            // Let's force size > MAX by manually setting many keys
            // But Map doesn't enforce limit, pruneCache does.

            // We'll set size to MAX + 5 total items (including above 4)
            // So we need MAX + 1 items essentially to trigger loop.

            // Let's just create a scenario where we are OVER limit and call pruneCache
            const needed = ORIGIN_CACHE_MAX_ENTRIES + 10;
            for (let i = 0; i < needed; i++) {
                originDecisionCache.set(`fresh-${i}.com`, { allowed: true, expiresAt: now + 60000 });
            }

            // Manually re-add our special test cases to ensure they are present
            originDecisionCache.set('expired1.com', { allowed: false, expiresAt: now - 1000 });
            originDecisionCache.set('denied1.com', { allowed: false, expiresAt: now + 60000 });

            // Current size is huge.
            expect(originDecisionCache.size).toBeGreaterThan(ORIGIN_CACHE_MAX_ENTRIES);

            // Call pruneCache
            pruneCache();

            // Assertions:
            // 1. Expired should be gone
            expect(originDecisionCache.has('expired1.com')).toBe(false);

            // 2. Denied should be gone (if we were over limit, which we were)
            expect(originDecisionCache.has('denied1.com')).toBe(false);

            // 3. Size should be <= MAX
            expect(originDecisionCache.size).toBeLessThanOrEqual(ORIGIN_CACHE_MAX_ENTRIES);
        });
    });

    // Skipped Context Null Safety test due to complexity of mocking Supabase client

    describe('4. Zod Strict Mode', () => {
        it('should reject unknown parameters in strict mode', () => {
            const schema = z.object({ id: z.string() }).strict();
            const params = new URLSearchParams({ id: '123', extra: 'bad' });

            expect(() => {
                parseInboxQueryParams(params, schema);
            }).toThrow(HttpError);
        });

        it('should verify baseInboxQuerySchema is strict', () => {
            const params = new URLSearchParams({
                site_id: '550e8400-e29b-41d4-a716-446655440000',
                unknown_param: 'should_fail'
            });

            expect(() => {
                parseInboxQueryParams(params, baseInboxQuerySchema);
            }).toThrow();
        });
    });
});
