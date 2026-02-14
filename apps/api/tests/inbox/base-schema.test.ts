/**
 * Base Inbox Query Schema Tests
 *
 * Tests for the base inbox query schema validation
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { baseInboxQuerySchema } from "@/server/inbox/base-schema";

describe("baseInboxQuerySchema", () => {
    describe("valid inputs", () => {
        it("should parse valid query with all fields", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = {
                site_id: validUuid,
                page: "2",
                limit: "25",
                search: "test query",
                status: "read",
                date_from: "2024-01-01",
                date_to: "2024-12-31",
            };

            const result = baseInboxQuerySchema.parse(input);

            expect(result.site_id).toBe(validUuid);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(25);
            expect(result.search).toBe("test query");
            expect(result.status).toBe("read");
            expect(result.date_from).toBe("2024-01-01");
            expect(result.date_to).toBe("2024-12-31");
        });

        it("should parse query with only required fields", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = {
                site_id: validUuid,
            };

            const result = baseInboxQuerySchema.parse(input);

            expect(result.site_id).toBe(validUuid);
            expect(result.page).toBe(1); // default
            expect(result.limit).toBe(50); // default
            expect(result.search).toBeUndefined();
            expect(result.status).toBeUndefined();
        });

        it("should accept unread status", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = {
                site_id: validUuid,
                status: "unread",
            };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.status).toBe("unread");
        });
    });

    describe("site_id validation", () => {
        it("should reject invalid UUID format", () => {
            const input = {
                site_id: "not-a-uuid",
            };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should reject empty site_id", () => {
            const input = {
                site_id: "",
            };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should reject missing site_id", () => {
            const input = {};

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });
    });

    describe("page and limit defaults", () => {
        it("should default page to 1 when not provided", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.page).toBe(1);
        });

        it("should default limit to 50 when not provided", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.limit).toBe(50);
        });

        it("should coerce string page to number", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, page: "5" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.page).toBe(5);
        });

        it("should coerce string limit to number", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, limit: "75" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.limit).toBe(75);
        });
    });

    describe("page validation", () => {
        it("should reject page less than 1", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, page: "0" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should reject negative page", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, page: "-1" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should reject non-integer page", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, page: "1.5" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });
    });

    describe("limit validation", () => {
        it("should reject limit less than 1", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, limit: "0" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should reject limit greater than 100", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, limit: "101" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should accept limit of 100", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, limit: "100" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.limit).toBe(100);
        });

        it("should accept limit of 1", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, limit: "1" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.limit).toBe(1);
        });
    });

    describe("search validation", () => {
        it("should accept search with minimum length", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, search: "ab" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.search).toBe("ab");
        });

        it("should reject search with less than minimum length", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, search: "a" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should accept long search strings up to max length", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            // Max search length is 80 characters
            const longSearch = "a".repeat(80);
            const input = { site_id: validUuid, search: longSearch };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.search).toBe(longSearch);
        });

        it("should reject search strings exceeding max length", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const tooLongSearch = "a".repeat(81);
            const input = { site_id: validUuid, search: tooLongSearch };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });
    });

    describe("status enum validation", () => {
        it("should accept 'read' status", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, status: "read" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.status).toBe("read");
        });

        it("should accept 'unread' status", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, status: "unread" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.status).toBe("unread");
        });

        it("should reject invalid status", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, status: "invalid" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should reject empty status", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, status: "" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });
    });

    describe("date range validation", () => {
        it("should accept valid date_from", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, date_from: "2024-01-01" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.date_from).toBe("2024-01-01");
        });

        it("should accept valid date_to", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, date_to: "2024-12-31" };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.date_to).toBe("2024-12-31");
        });

        it("should accept both date_from and date_to", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = {
                site_id: validUuid,
                date_from: "2024-01-01",
                date_to: "2024-12-31",
            };

            const result = baseInboxQuerySchema.parse(input);
            expect(result.date_from).toBe("2024-01-01");
            expect(result.date_to).toBe("2024-12-31");
        });

        it("should reject empty date_from", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, date_from: "" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });

        it("should reject empty date_to", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = { site_id: validUuid, date_to: "" };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });
    });

    describe("schema extension", () => {
        it("should allow extending with additional fields", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const extendedSchema = baseInboxQuerySchema.extend({
                custom_field: z.string().optional(),
            });

            const input = {
                site_id: validUuid,
                custom_field: "custom value",
            };

            const result = extendedSchema.parse(input);
            expect(result.site_id).toBe(validUuid);
            expect(result.custom_field).toBe("custom value");
        });

        it("should maintain base schema validation in extended schema", () => {
            const extendedSchema = baseInboxQuerySchema.extend({
                custom_field: z.string().optional(),
            });

            const input = {
                site_id: "invalid-uuid",
                custom_field: "custom value",
            };

            expect(() => extendedSchema.parse(input)).toThrow();
        });
    });

    describe("strict mode", () => {
        it("should reject unknown fields", () => {
            const validUuid = "550e8400-e29b-41d4-a716-446655440000";
            const input = {
                site_id: validUuid,
                unknown_field: "value",
            };

            expect(() => baseInboxQuerySchema.parse(input)).toThrow();
        });
    });
});
