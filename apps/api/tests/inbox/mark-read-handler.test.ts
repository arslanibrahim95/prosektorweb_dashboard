import { describe, it, expect, vi } from "vitest";
import { createMarkReadHandler } from "@/server/inbox/mark-read-handler";
import { hasPermission } from "@/server/auth/permissions";
import { enforceRateLimit } from "@/server/rate-limit";

vi.mock("@/server/auth/context", () => ({
    requireAuthContext: vi.fn().mockResolvedValue({
        admin: {} as any,
        supabase: { from: vi.fn() } as any,
        tenant: { id: "tenant-1" },
        user: { id: "user-1" },
        permissions: [],
        role: "member",
    }),
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
        (hasPermission as unknown as vi.Mock).mockReturnValue(false);
        const handler = createMarkReadHandler("contact_messages");

        const res = await handler(new Request("https://example.com", { method: "POST" }), { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) });

        expect(res.status).toBe(403);
    });

    it("enforces rate limit before updating", async () => {
        (hasPermission as unknown as vi.Mock).mockReturnValue(true);
        (enforceRateLimit as unknown as vi.Mock).mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date().toISOString(), limit: 10 });

        const handler = createMarkReadHandler("contact_messages");
        const res = await handler(new Request("https://example.com", { method: "POST" }), { params: Promise.resolve({ id: "1" }) });

        expect(enforceRateLimit).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(res.headers.get("x-ratelimit-limit")).toBe("1");
    });
});
