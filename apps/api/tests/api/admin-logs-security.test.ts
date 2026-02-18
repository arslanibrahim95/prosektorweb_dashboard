import { describe, it, expect } from "vitest";
import { z } from "zod";
import { adminLogsQuerySchema } from "../../src/app/api/admin/logs/route";

describe("admin logs query schema — security", () => {
    describe("SQL/PostgREST injection prevention", () => {
        it("rejects comma-based PostgREST injection in search", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "foo,is_read.eq.true",
            });
            expect(result.success).toBe(false);
        });

        it("rejects parenthesis-based PostgREST injection in search", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "foo)or(is_read.eq.true",
            });
            expect(result.success).toBe(false);
        });

        it("rejects special character injection", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "foo<script>alert(1)</script>",
            });
            // Angle brackets are blocked by safeSearchParamSchema
            expect(result.success).toBe(false);
        });

        it("rejects semicolon SQL injection attempt", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "foo; DROP TABLE audit_logs;--",
            });
            expect(result.success).toBe(false);
        });
    });

    describe("valid searches", () => {
        it("accepts simple text search", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "login attempt",
            });
            expect(result.success).toBe(true);
        });

        it("accepts email-like search", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "user@example+test",
            });
            expect(result.success).toBe(true);
        });

        it("accepts search with hyphens and underscores", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "ip-block_action",
            });
            expect(result.success).toBe(true);
        });
    });

    describe("pagination validation", () => {
        it("defaults page to 1 and limit to 20", () => {
            const result = adminLogsQuerySchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(1);
                expect(result.data.limit).toBe(20);
            }
        });

        it("accepts valid pagination params", () => {
            const result = adminLogsQuerySchema.safeParse({
                page: "3",
                limit: "50",
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(3);
                expect(result.data.limit).toBe(50);
            }
        });

        it("rejects page less than 1", () => {
            const result = adminLogsQuerySchema.safeParse({
                page: "0",
            });
            expect(result.success).toBe(false);
        });

        it("rejects limit greater than 100", () => {
            const result = adminLogsQuerySchema.safeParse({
                limit: "101",
            });
            expect(result.success).toBe(false);
        });

        it("rejects negative limit", () => {
            const result = adminLogsQuerySchema.safeParse({
                limit: "-5",
            });
            expect(result.success).toBe(false);
        });
    });

    describe("filter validation", () => {
        it("accepts level filter (alias for action)", () => {
            const result = adminLogsQuerySchema.safeParse({
                level: "warning",
                page: 1,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.level).toBe("warning");
            }
        });

        it("accepts action filter", () => {
            const result = adminLogsQuerySchema.safeParse({
                action: "member_invite",
            });
            expect(result.success).toBe(true);
        });

        it("accepts entity_type filter", () => {
            const result = adminLogsQuerySchema.safeParse({
                entity_type: "tenant_member",
            });
            expect(result.success).toBe(true);
        });

        it("accepts date range filters", () => {
            const result = adminLogsQuerySchema.safeParse({
                date_from: "2025-01-01",
                date_to: "2025-12-31",
            });
            expect(result.success).toBe(true);
        });

        it("rejects unexpected fields (strict mode)", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "test",
                malicious_field: "value",
            });
            expect(result.success).toBe(false);
        });
    });

    describe("combined params", () => {
        it("accepts all valid params combined", () => {
            const result = adminLogsQuerySchema.safeParse({
                search: "domain update",
                level: "info",
                action: "settings_update",
                entity_type: "tenant",
                page: "2",
                limit: "25",
                date_from: "2025-01-01",
                date_to: "2025-06-30",
            });
            expect(result.success).toBe(true);
        });
    });
});
