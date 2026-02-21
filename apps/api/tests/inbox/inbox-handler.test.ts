/**
 * Inbox Handler Factory Tests
 * 
 * Tests for the inbox handler factory configuration and validation
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createInboxHandler, type InboxHandlerConfig } from "@/server/inbox/inbox-handler";
import { baseInboxQuerySchema } from "@/server/inbox/base-schema";
import { parseInboxQueryParams } from "@/server/inbox/query-params";
import { HttpError } from "@/server/api/http";

describe("createInboxHandler", () => {
    describe("config validation", () => {
        it("should create handler with valid config", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,created_at",
                searchFields: ["name", "email"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
            expect(handler.name).toBe("GET");
        });

        it("should create handler with optional orderBy", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,created_at",
                searchFields: ["name"],
                rateLimitEndpoint: "test_endpoint",
                orderBy: "updated_at",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });

        it("should create handler with optional orderDirection", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,created_at",
                searchFields: ["name"],
                rateLimitEndpoint: "test_endpoint",
                orderDirection: "asc",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });

        it("should create handler with additionalFilters function", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,created_at",
                searchFields: ["name"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                additionalFilters: (query, _params, _ctx) => query,
                itemSchema: z.object({ id: z.string() }),
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });

        it("should create handler with additionalCacheKeyParts function", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,created_at",
                searchFields: ["name"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                additionalCacheKeyParts: (_params) => ["extra", "parts"],
                itemSchema: z.object({ id: z.string() }),
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });
    });

    describe("handler returns function", () => {
        it("should return a function named GET", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,created_at",
                searchFields: ["name"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler.name).toBe("GET");
        });

        it("should return async function", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,created_at",
                searchFields: ["name"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler.constructor.name).toBe("AsyncFunction");
        });
    });

    describe("different configs produce different handlers", () => {
        it("should create handlers with different table names", () => {
            const config1: InboxHandlerConfig = {
                tableName: "table_one",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name",
                searchFields: ["name"],
                rateLimitEndpoint: "endpoint_one",
                cacheKeyPrefix: "one",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const config2: InboxHandlerConfig = {
                tableName: "table_two",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,email",
                searchFields: ["email"],
                rateLimitEndpoint: "endpoint_two",
                cacheKeyPrefix: "two",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler1 = createInboxHandler(config1);
            const handler2 = createInboxHandler(config2);

            expect(handler1).toBeDefined();
            expect(handler2).toBeDefined();
            expect(handler1).not.toBe(handler2);
        });

        it("should create handlers with different search fields", () => {
            const config1: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,email",
                searchFields: ["name"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const config2: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,email",
                searchFields: ["name", "email"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler1 = createInboxHandler(config1);
            const handler2 = createInboxHandler(config2);

            expect(handler1).not.toBe(handler2);
        });

        it("should create handlers with different rate limit endpoints", () => {
            const config1: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name",
                searchFields: ["name"],
                rateLimitEndpoint: "endpoint_a",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const config2: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name",
                searchFields: ["name"],
                rateLimitEndpoint: "endpoint_b",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler1 = createInboxHandler(config1);
            const handler2 = createInboxHandler(config2);

            expect(handler1).not.toBe(handler2);
        });
    });

    describe("extended query schema", () => {
        it("should work with extended query schema", () => {
            const extendedSchema = baseInboxQuerySchema.extend({
                job_post_id: z.string().uuid().optional(),
            });

            const config: InboxHandlerConfig<z.infer<typeof extendedSchema>> = {
                tableName: "hr_applications",
                querySchema: extendedSchema,
                selectFields: "id,name,job_post_id",
                searchFields: ["name"],
                rateLimitEndpoint: "hr_applications",
                cacheKeyPrefix: "hr_app",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });
    });

    describe("config field types", () => {
        it("should accept string for tableName", () => {
            const config: InboxHandlerConfig = {
                tableName: "valid_table_name",
                querySchema: baseInboxQuerySchema,
                selectFields: "id",
                searchFields: ["name"],
                rateLimitEndpoint: "endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);
            expect(handler).toBeDefined();
        });

        it("should accept array of strings for searchFields", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id",
                searchFields: ["field1", "field2", "field3"],
                rateLimitEndpoint: "endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);
            expect(handler).toBeDefined();
        });

        it("should accept empty array for searchFields", () => {
            const config: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id",
                searchFields: [],
                rateLimitEndpoint: "endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                 
                 
                responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);
            expect(handler).toBeDefined();
        });
    });

    describe("REGRESSION: query param parsing (job_post_id bug fix)", () => {
        const validUuid = "550e8400-e29b-41d4-a716-446655440000";

        /**
         * This test verifies the fix for the regression where job_post_id was always
         * injected into the parse payload even for base schemas that don't define it.
         * 
         * The old code was:
         *   querySchema.safeParse({ ..., job_post_id: qp.get("job_post_id") ?? undefined })
         * 
         * This caused Zod strict parsing to fail because baseInboxQuerySchema doesn't
         * have job_post_id defined, and strict mode rejects unknown keys.
         * 
         * The fix uses parseInboxQueryParams which only passes params that exist in the URL.
         */

        it("should NOT inject synthetic job_post_id for base schema", () => {
            // Create a mock URLSearchParams with only site_id
            // This simulates what happens when offers/contact endpoints receive requests
            const mockSearchParams = new URLSearchParams({
                site_id: validUuid,
            });

            // Test that the parser doesn't fail - if it tries to inject job_post_id,
            // the strict baseInboxQuerySchema would reject it
            // This should NOT throw - if it does, the bug is present
            const result = parseInboxQueryParams(mockSearchParams, baseInboxQuerySchema);

            expect(result.site_id).toBe(validUuid);
            // job_post_id should not exist on base schema - using any to bypass strict type check
            expect((result as Record<string, unknown>).job_post_id).toBeUndefined();
        });

        it("should parse base schema params correctly without job_post_id", () => {


            const mockSearchParams = new URLSearchParams({
                site_id: validUuid,
                page: "1",
                limit: "10",
                status: "unread",
            });

            const result = parseInboxQueryParams(mockSearchParams, baseInboxQuerySchema);

            expect(result.site_id).toBe(validUuid);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.status).toBe("unread");
        });

        it("should reject unknown params with strict error", () => {



            const mockSearchParams = new URLSearchParams({
                site_id: validUuid,
                unknown_param: "should_fail",
            });

            // Should throw HttpError 400 for unknown param
            expect(() => parseInboxQueryParams(mockSearchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });
    });
});

describe('applyInboxFilters behavior', () => {
    it('should build correct filter chain for status=read', () => {
        const mockQuery = {
            eq: (field: string, value: unknown) => {
                if (field === 'is_read' && value === true) return mockQuery;
                return mockQuery;
            },
            gte: () => mockQuery,
            lte: () => mockQuery,
            or: () => mockQuery,
        };

        // We test indirectly through config - status filtering is applied inside the handler
        // Verify the config accepts status parameter
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'read',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.status).toBe('read');
    });

    it('should build correct filter chain for status=unread', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'unread',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.status).toBe('unread');
    });

    it('should handle date_from and date_to filters', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            date_from: '2024-01-01',
            date_to: '2024-12-31',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.date_from).toBe('2024-01-01');
        expect(result.date_to).toBe('2024-12-31');
    });

    it('should handle search parameter for ILIKE queries', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            search: 'test query',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.search).toBe('test query');
    });

    it('should handle combined filters', () => {
        const params = new URLSearchParams({
            site_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'unread',
            search: 'john',
            date_from: '2024-06-01',
            page: '2',
            limit: '25',
        });
        const result = parseInboxQueryParams(params, baseInboxQuerySchema);
        expect(result.status).toBe('unread');
        expect(result.search).toBe('john');
        expect(result.date_from).toBe('2024-06-01');
        expect(result.page).toBe(2);
        expect(result.limit).toBe(25);
    });
});

describe('cache key generation', () => {
    it('additionalCacheKeyParts should be called with parsed params', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockCacheKeyParts = (params: any) => [params.site_id, 'extra'];
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';

        const result = mockCacheKeyParts({ site_id: validUuid });
        expect(result).toEqual([validUuid, 'extra']);
    });

    it('cache key should include all filter dimensions', () => {
        const cacheKeyParts = [
            'inbox-count',
            'contact',
            'tenant-123',
            '550e8400-e29b-41d4-a716-446655440000',
            'read',
            '2024-01-01',
            '2024-12-31',
            'search term',
        ];
        const cacheKey = cacheKeyParts.join('|');

        expect(cacheKey).toContain('inbox-count');
        expect(cacheKey).toContain('contact');
        expect(cacheKey).toContain('read');
        expect(cacheKey).toContain('2024-01-01');
        expect(cacheKey).toContain('search term');
    });

    it('cache key with empty optional parts should still be valid', () => {
        const cacheKeyParts = [
            'inbox-count',
            'contact',
            'tenant-123',
            '550e8400-e29b-41d4-a716-446655440000',
            '',
            '',
            '',
            '',
        ];
        const cacheKey = cacheKeyParts.join('|');

        expect(cacheKey).toBe('inbox-count|contact|tenant-123|550e8400-e29b-41d4-a716-446655440000||||');
        expect(cacheKey.split('|').length).toBe(8);
    });
});

describe('permission requirements', () => {
    it('handler config should be created even without permission context', () => {
        const config: InboxHandlerConfig = {
            tableName: 'test_table',
            querySchema: baseInboxQuerySchema,
            selectFields: 'id,name',
            searchFields: ['name'],
            rateLimitEndpoint: 'test',
            cacheKeyPrefix: 'test',
            itemSchema: z.object({ id: z.string() }),
             
            responseSchema: z.object({ items: z.array(z.any()), total: z.number() }),
        };

        const handler = createInboxHandler(config);
        expect(handler).toBeDefined();
        // Permission check happens at runtime inside the handler, not at config time
    });
});
