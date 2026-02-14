/**
 * Inbox Handler Factory Tests
 * 
 * Tests for the inbox handler factory configuration and validation
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createInboxHandler, type InboxHandlerConfig } from "@/server/inbox/inbox-handler";
import { baseInboxQuerySchema } from "@/server/inbox/base-schema";

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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                additionalFilters: (query, _params, _ctx) => query,
                itemSchema: z.object({ id: z.string() }),
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                additionalCacheKeyParts: (_params) => ["extra", "parts"],
                itemSchema: z.object({ id: z.string() }),
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
            };

            const config2: InboxHandlerConfig = {
                tableName: "table_two",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,email",
                searchFields: ["email"],
                rateLimitEndpoint: "endpoint_two",
                cacheKeyPrefix: "two",
                itemSchema: z.object({ id: z.string() }),
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
            };

            const config2: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name,email",
                searchFields: ["name", "email"],
                rateLimitEndpoint: "test_endpoint",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
            };

            const config2: InboxHandlerConfig = {
                tableName: "test_table",
                querySchema: baseInboxQuerySchema,
                selectFields: "id,name",
                searchFields: ["name"],
                rateLimitEndpoint: "endpoint_b",
                cacheKeyPrefix: "test",
                itemSchema: z.object({ id: z.string() }),
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
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
                responseSchema: z.object({ data: z.array(z.any()), total: z.number() }),
            };

            const handler = createInboxHandler(config);
            expect(handler).toBeDefined();
        });
    });
});
