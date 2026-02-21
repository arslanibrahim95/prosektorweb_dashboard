import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";
import { createTestAuthContext } from "../helpers/auth-context";

vi.mock("@/server/auth/context", () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock("@/server/auth/route-rate-limit", () => ({
  enforceAuthRouteRateLimit: vi.fn(),
}));

import { GET, POST } from "../../src/app/api/builder/components/route";

const TENANT_ID = "aaaaaaaa-0000-4000-8001-000000000001";

describe("builder components route validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthContext).mockResolvedValue(
      createTestAuthContext({
        tenant: { id: TENANT_ID },
        activeTenantId: TENANT_ID,
      }),
    );
    vi.mocked(enforceAuthRouteRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
      limit: 100,
    });
  });

  it("POST returns 400 when required fields are missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/builder/components", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
  });

  it("GET returns 400 for invalid category query", async () => {
    const response = await GET(
      new Request("http://localhost/api/builder/components?category=invalid", {
        method: "GET",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
  });
});
