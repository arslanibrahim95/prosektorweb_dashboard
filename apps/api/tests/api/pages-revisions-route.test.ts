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

import { GET as listPages } from "../../src/app/api/pages/route";
import { GET as listRevisions } from "../../src/app/api/pages/[id]/revisions/route";

const TENANT_ID = "aaaaaaaa-0000-4000-8001-000000000001";

describe("pages and revisions route validation", () => {
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

  it("GET /pages returns 400 when site_id is invalid", async () => {
    const response = await listPages(new Request("http://localhost/api/pages?site_id=invalid", { method: "GET" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
  });

  it("GET /pages/[id]/revisions returns 400 when page id is invalid", async () => {
    const response = await listRevisions(
      new Request("http://localhost/api/pages/invalid/revisions", { method: "GET" }),
      { params: Promise.resolve({ id: "invalid" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
  });
});
