/**
 * Query Params Parser Tests
 *
 * Tests for the centralized inbox query params parser utility
 * This ensures strict parsing behavior and prevents regression of the job_post_id bug
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { HttpError } from "@/server/api/http";
import { parseInboxQueryParams } from "@/server/inbox/query-params";
import { baseInboxQuerySchema } from "@/server/inbox/base-schema";

describe("parseInboxQueryParams", () => {
    const validUuid = "550e8400-e29b-41d4-a716-446655440000";

    describe("valid inputs", () => {
        it("should parse valid base inbox params successfully", () => {
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                page: "1",
                limit: "10",
            });

            const result = parseInboxQueryParams(searchParams, baseInboxQuerySchema);

            expect(result.site_id).toBe(validUuid);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it("should parse base inbox params with all optional fields", () => {
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                page: "2",
                limit: "25",
                search: "test query",
                status: "read",
                date_from: "2024-01-01",
                date_to: "2024-12-31",
            });

            const result = parseInboxQueryParams(searchParams, baseInboxQuerySchema);

            expect(result.site_id).toBe(validUuid);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(25);
            expect(result.search).toBe("test query");
            expect(result.status).toBe("read");
            expect(result.date_from).toBe("2024-01-01");
            expect(result.date_to).toBe("2024-12-31");
        });

        it("should parse with only required site_id field", () => {
            const searchParams = new URLSearchParams({
                site_id: validUuid,
            });

            const result = parseInboxQueryParams(searchParams, baseInboxQuerySchema);

            expect(result.site_id).toBe(validUuid);
            expect(result.page).toBe(1); // default
            expect(result.limit).toBe(50); // default
        });
    });

    describe("strict unknown key rejection", () => {
        it("should reject unknown job_post_id with base schema (strict mode)", () => {
            // This is the regression case: base schema (offers/contact) should NOT accept job_post_id
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                job_post_id: "some-uuid",
            });

            // Should throw HttpError with 400 status
            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });

        it("should reject unknown random param with strict unknown key error", () => {
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                foo: "bar",
            });

            // Should throw HttpError with 400 status
            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });

        it("should reject multiple unknown params", () => {
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                unknown1: "value1",
                unknown2: "value2",
            });

            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });
    });

    describe("extended schema with job_post_id", () => {
        // Create an extended schema that includes job_post_id
        const extendedInboxQuerySchema = baseInboxQuerySchema.extend({
            job_post_id: z.string().uuid(),
        });

        it("should parse extended schema with job_post_id successfully", () => {
            const jobPostId = "550e8400-e29b-41d4-a716-446655440001";
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                job_post_id: jobPostId,
            });

            const result = parseInboxQueryParams(searchParams, extendedInboxQuerySchema);

            expect(result.site_id).toBe(validUuid);
            expect(result.job_post_id).toBe(jobPostId);
        });

        it("should reject base schema when job_post_id is in URL but schema doesn't support it", () => {
            const jobPostId = "550e8400-e29b-41d4-a716-446655440001";
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                job_post_id: jobPostId,
            });

            // This should fail because base schema doesn't have job_post_id
            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });
    });

    describe("validation errors", () => {
        it("should throw HttpError 400 for missing required site_id", () => {
            const searchParams = new URLSearchParams({
                page: "1",
            });

            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });

        it("should throw HttpError 400 for invalid UUID format", () => {
            const searchParams = new URLSearchParams({
                site_id: "not-a-uuid",
            });

            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });

        it("should throw HttpError 400 for invalid status value", () => {
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                status: "invalid_status",
            });

            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });

        it("should throw HttpError 400 for invalid page value", () => {
            const searchParams = new URLSearchParams({
                site_id: validUuid,
                page: "0", // page must be >= 1
            });

            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });
    });

    describe("empty searchParams handling", () => {
        it("should throw for empty searchParams (missing required site_id)", () => {
            const searchParams = new URLSearchParams();

            expect(() => parseInboxQueryParams(searchParams, baseInboxQuerySchema)).toThrow(HttpError);
        });
    });
});
