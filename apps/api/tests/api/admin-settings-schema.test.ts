import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for the admin settings PATCH schema validation.
 * We define the schema inline (matching the route's schema) to test
 * validation rules without requiring full route context.
 */
const settingsPatchSchema = z.object({
    tenant: z.object({
        name: z.string().min(1).max(100).optional(),
        plan: z.string().min(1).max(50).optional(),
    }).optional(),
    site: z.object({
        id: z.string().uuid(),
        settings: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
    security: z.record(z.string(), z.unknown()).optional(),
}).strict();

describe("admin settings PATCH schema", () => {
    describe("tenant fields", () => {
        it("accepts valid tenant name", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "My Workspace" },
            });
            expect(result.success).toBe(true);
        });

        it("accepts valid tenant plan", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { plan: "pro" },
            });
            expect(result.success).toBe(true);
        });

        it("rejects empty tenant name", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "" },
            });
            expect(result.success).toBe(false);
        });

        it("rejects tenant name longer than 100 chars", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "x".repeat(101) },
            });
            expect(result.success).toBe(false);
        });

        it("rejects empty plan string", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { plan: "" },
            });
            expect(result.success).toBe(false);
        });

        it("rejects plan longer than 50 chars", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { plan: "x".repeat(51) },
            });
            expect(result.success).toBe(false);
        });
    });

    describe("site fields", () => {
        it("accepts valid site with UUID and settings", () => {
            const result = settingsPatchSchema.safeParse({
                site: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    settings: { theme: "dark", logo_url: "https://example.com/logo.png" },
                },
            });
            expect(result.success).toBe(true);
        });

        it("rejects site with invalid UUID", () => {
            const result = settingsPatchSchema.safeParse({
                site: { id: "not-a-uuid", settings: {} },
            });
            expect(result.success).toBe(false);
        });

        it("rejects site without id", () => {
            const result = settingsPatchSchema.safeParse({
                site: { settings: {} },
            });
            expect(result.success).toBe(false);
        });
    });

    describe("security fields", () => {
        it("accepts valid security settings", () => {
            const result = settingsPatchSchema.safeParse({
                security: {
                    two_factor_required: true,
                    session_timeout_minutes: 30,
                    ip_whitelist_enabled: false,
                },
            });
            expect(result.success).toBe(true);
        });

        it("accepts empty security object", () => {
            const result = settingsPatchSchema.safeParse({
                security: {},
            });
            expect(result.success).toBe(true);
        });
    });

    describe("strict mode — prevents field injection", () => {
        it("rejects unknown top-level fields", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "Valid" },
                malicious_field: "DROP TABLE tenants",
            });
            expect(result.success).toBe(false);
        });

        it("rejects injecting role field", () => {
            const result = settingsPatchSchema.safeParse({
                role: "super_admin",
            });
            expect(result.success).toBe(false);
        });

        it("rejects injecting password field", () => {
            const result = settingsPatchSchema.safeParse({
                password: "hacked",
            });
            expect(result.success).toBe(false);
        });
    });

    describe("empty body", () => {
        it("accepts empty body (no-op update)", () => {
            const result = settingsPatchSchema.safeParse({});
            expect(result.success).toBe(true);
        });
    });

    describe("combined fields", () => {
        it("accepts tenant + site + security in one request", () => {
            const result = settingsPatchSchema.safeParse({
                tenant: { name: "Updated Corp" },
                site: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    settings: { theme: "light" },
                },
                security: { two_factor_required: true },
            });
            expect(result.success).toBe(true);
        });
    });
});
