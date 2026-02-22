import { describe, it, expect, vi, type Mock } from "vitest";
import { createMarkReadHandler } from "@/server/inbox/mark-read-handler";
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
    role: "viewer" as const,
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
                select: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "1" } }) })),
            })),
        })),
    })),
}));

describe("createMarkReadHandler", () => {
    it("returns 403 when inbox:read permission missing", async () => {
        (hasPermission as unknown as Mock).mockReturnValue(false);
        const handler = createMarkReadHandler("contact_messages");

        (requireAuthContext as Mock).mockResolvedValue(createAuthContext({ permissions: [] }));

        const res = await handler(new Request("https://example.com", { method: "POST" }), { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });

        expect(res.status).toBe(403);
    });

    it("enforces rate limit before updating", async () => {
        (hasPermission as unknown as Mock).mockReturnValue(true);
        (enforceRateLimit as unknown as Mock).mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date().toISOString(), limit: 10 });

        const handler = createMarkReadHandler("contact_messages");
        (requireAuthContext as Mock).mockResolvedValue(createAuthContext({ permissions: ["inbox:read"] }));
        const res = await handler(new Request("https://example.com", { method: "POST" }), { params: Promise.resolve({ id: "1" }) });

        expect(enforceRateLimit).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(res.headers.get("x-ratelimit-limit")).toBe("1");
    });
});
