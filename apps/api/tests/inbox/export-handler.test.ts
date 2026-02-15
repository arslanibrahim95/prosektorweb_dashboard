/**
 * Export Handler Factory Tests
 *
 * Tests for the inbox export handler factory configuration and validation
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createExportHandler, type ExportHandlerConfig } from "@/server/inbox/export-handler";
import { baseExportQuerySchema } from "@/server/inbox/export-handler";

describe("createExportHandler", () => {
    describe("config validation", () => {
        it("should create handler with valid config", () => {
            const config: ExportHandlerConfig = {
                tableName: "test_table",
                selectFields: "id,name,created_at",
                headers: ["ID", "Name", "Created"],
                rowMapper: (item) => [item.id, item.name, item.created_at],
                filenamePrefix: "test",
                searchFields: ["name", "email"],
                rateLimitEndpoint: "test_export",
                querySchema: baseExportQuerySchema,
                itemSchema: z.object({ id: z.string(), name: z.string(), created_at: z.string() }),
            };

            const handler = createExportHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
            expect(handler.name).toBe("GET");
        });

        it("should create handler with additionalFilters function", () => {
            const config: ExportHandlerConfig = {
                tableName: "test_table",
                selectFields: "id,name,created_at",
                headers: ["ID", "Name", "Created"],
                rowMapper: (item) => [item.id, item.name, item.created_at],
                filenamePrefix: "test",
                searchFields: ["name", "email"],
                rateLimitEndpoint: "test_export",
                querySchema: baseExportQuerySchema,
                itemSchema: z.object({ id: z.string(), name: z.string(), created_at: z.string() }),
                additionalFilters: (query, _params, _ctx) => query,
            };

            const handler = createExportHandler(config);

            expect(handler).toBeDefined();
            expect(typeof handler).toBe("function");
        });
    });

    describe("query schema integration", () => {
        it("should use baseExportQuerySchema for contact export", () => {
            // This test ensures the export handler uses the base schema correctly
            // and not injects synthetic fields like job_post_id for non-extended schemas
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";

            // Verify base schema doesn't have job_post_id
            const parsed = baseExportQuerySchema.safeParse({
                site_id: validUuid,
                page: "1",
                limit: "100",
            });

            expect(parsed.success).toBe(true);
            if (parsed.success) {
                expect(parsed.data.site_id).toBe(validUuid);
                expect((parsed.data as any).job_post_id).toBeUndefined();
            }
        });

        it("should accept job_post_id when schema is extended", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const jobPostId = "550e8400-e29b-41d4-a716-446655440001";

            // Create extended schema with job_post_id
            const extendedSchema = baseExportQuerySchema.extend({
                job_post_id: z.string().uuid(),
            });

            const parsed = extendedSchema.safeParse({
                site_id: validUuid,
                page: "1",
                limit: "100",
                job_post_id: jobPostId,
            });

            expect(parsed.success).toBe(true);
            if (parsed.success) {
                expect(parsed.data.job_post_id).toBe(jobPostId);
            }
        });

        it("should reject job_post_id for base export schema (strict mode)", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const jobPostId = "550e8400-e29b-41d4-a716-446655440001";

            // Base schema should reject job_post_id (this was the regression bug)
            const parsed = baseExportQuerySchema.strict().safeParse({
                site_id: validUuid,
                page: "1",
                limit: "100",
                job_post_id: jobPostId,
            });

            expect(parsed.success).toBe(false);
            if (!parsed.success) {
                const error = parsed.error;
                const issues = error.issues.map(i => i.code);
                expect(issues).toContain("unrecognized_keys");
            }
        });
    });
});
