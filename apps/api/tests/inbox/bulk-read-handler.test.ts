import { describe, it, expect, vi } from "vitest";
import { createBulkReadHandler } from "@/server/inbox/bulk-read-handler";
import { hasPermission } from "@/server/auth/permissions";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireAuthContext } from "@/server/auth/context";
import type { AuthContext } from "@/server/auth/context";

const baseAuthContext: AuthContext = {
    admin: {} as AuthContext["admin"],
    supabase: {} as AuthContext["supabase"],
    tenant: {
        id: "tenant-1",
        name: "Tenant",
        slug: "tenant",
        plan: "pro",
        status: "active",
    },
    user: {
        id: "user-1",
        email: "user@test.dev",
        name: "Test User",
    },
    activeTenantId: "tenant-1",
    availableTenants: [
        {
            id: "tenant-1",
            name: "Tenant",
            slug: "tenant",
            plan: "pro",
            status: "active",
        },
    ],
    role: "member",
    permissions: [],
};

const createAuthContext = (overrides: Partial<AuthContext> = {}): AuthContext => ({
    ...baseAuthContext,
    ...overrides,
});

vi.mock("@/server/auth/context", () => ({
    requireAuthContext: vi.fn(),
}));

vi.mock("@/server/auth/permissions", () => ({
    hasPermission: vi.fn(),
}));

vi.mock("@/server/rate-limit", () => ({
    enforceRateLimit: vi.fn(),
    rateLimitAuthKey: vi.fn(() => "rl-key"),
    rateLimitHeaders: vi.fn(() => ({ "x-ratelimit-limit": "1" })),
}));

vi.mock("@/server/env", () => ({ getServerEnv: () => ({ dashboardReadRateLimit: 10, dashboardReadRateWindowSec: 60 }) }));

vi.mock("@/server/inbox/query-utils", () => ({
    getInboxDbClient: vi.fn(() => ({
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                select: vi.fn(() => Promise.resolve({ data: [{ id: "1" }, { id: "2" }] })),
            })),
        })),
    })),
}));

describe("createBulkReadHandler", () => {
    it("returns 403 when inbox:read permission missing", async () => {
        (hasPermission as unknown as vi.Mock).mockReturnValue(false);
        const handler = createBulkReadHandler("contact_messages");

        (requireAuthContext as vi.Mock).mockResolvedValue(createAuthContext({ permissions: [] }));

        const res = await handler(new Request("https://example.com", { method: "POST", body: JSON.stringify({ ids: ["1"] }) }));

        expect(res.status).toBe(403);
    });

    it("enforces rate limit and returns updated count", async () => {
        (hasPermission as unknown as vi.Mock).mockReturnValue(true);
        (enforceRateLimit as unknown as vi.Mock).mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date().toISOString(), limit: 10 });

        const handler = createBulkReadHandler("contact_messages");
        (requireAuthContext as vi.Mock).mockResolvedValue(createAuthContext({ permissions: ["inbox:read"] }));
        const res = await handler(
            new Request("https://example.com", {
                method: "POST",
                body: JSON.stringify({
                    ids: [
                        "550e8400-e29b-41d4-a716-446655440000",
                        "550e8400-e29b-41d4-a716-446655440001",
                    ],
                }),
            })
        );

        expect(enforceRateLimit).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ updated: 2 });
        expect(res.headers.get("x-ratelimit-limit")).toBe("1");
    });
});
