import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";
import { signSiteToken } from "@/server/site-token";
import { createTestAuthContext } from "../helpers/auth-context";

vi.mock("@/server/auth/context", () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock("@/server/auth/route-rate-limit", () => ({
  enforceAuthRouteRateLimit: vi.fn(),
}));

vi.mock("@/server/site-token", () => ({
  signSiteToken: vi.fn(),
}));

import { PUT as updateSeo } from "../../src/app/api/sites/[id]/seo/route";
import { GET as getSiteToken } from "../../src/app/api/sites/[id]/site-token/route";

const TENANT_ID = "aaaaaaaa-0000-4000-8001-000000000001";
const makeBaseContext = () =>
  createTestAuthContext({
    tenant: { id: TENANT_ID },
    activeTenantId: TENANT_ID,
  });

describe("site SEO and site-token route validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enforceAuthRouteRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
      limit: 100,
    });
  });

  it("PUT /sites/[id]/seo returns 400 on invalid payload", async () => {
    vi.mocked(requireAuthContext).mockResolvedValue(makeBaseContext());

    const response = await updateSeo(
      new Request("http://localhost/api/sites/site-1/seo", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title_template: 123 }),
      }),
      { params: Promise.resolve({ id: "site-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
  });

  it("GET /sites/[id]/site-token returns 404 when site is not found", async () => {
    const select = vi.fn();
    const eq = vi.fn();
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const queryBuilder = { select, eq, maybeSingle };
    select.mockReturnValue(queryBuilder);
    eq.mockReturnValue(queryBuilder);
    const from = vi.fn().mockReturnValue(queryBuilder);

    vi.mocked(requireAuthContext).mockResolvedValue({
      ...makeBaseContext(),
      supabase: { from } as never,
    });

    const response = await getSiteToken(
      new Request("http://localhost/api/sites/site-1/site-token", { method: "GET" }),
      { params: Promise.resolve({ id: "site-1" }) },
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.code).toBe("NOT_FOUND");
    expect(signSiteToken).not.toHaveBeenCalled();
  });
});
