import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state = {
    dynamicDomains: [] as Array<{ domain: string; status: string }>,
    dynamicSites: [] as Array<{ primary_domain: string | null }>,
  };

  const createAdminClientMock = vi.fn(() => {
    return {
      from(table: string) {
        const filters: Record<string, unknown> = {};
        const neqFilters: Record<string, unknown> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chain: any = {};
        chain.select = vi.fn(() => chain);
        chain.eq = vi.fn((column: string, value: unknown) => {
          filters[column] = value;
          return chain;
        });
        chain.neq = vi.fn((column: string, value: unknown) => {
          neqFilters[column] = value;
          return chain;
        });
        chain.limit = vi.fn(() => chain);
        chain.maybeSingle = vi.fn(async () => {
          if (table === "domains") {
            const domain = String(filters.domain ?? "");
            const blockedStatus = neqFilters.status;
            const matched = state.dynamicDomains.find(
              (row) => row.domain === domain && row.status !== blockedStatus,
            );
            return { data: matched ? { id: "domain-id" } : null, error: null };
          }
          if (table === "sites") {
            const primaryDomain = String(filters.primary_domain ?? "");
            const matched = state.dynamicSites.find((row) => row.primary_domain === primaryDomain);
            return { data: matched ? { id: "site-id" } : null, error: null };
          }
          return { data: null, error: null };
        });
        return chain;
      },
    };
  });

  return {
    state,
    createAdminClientMock,
  createUserClientFromBearerMock: vi.fn(),
  getBearerTokenMock: vi.fn(() => null),
  enforceRateLimitMock: vi.fn(async () => ({
    allowed: true,
    remaining: 9,
    resetAt: "2026-02-12T00:00:00.000Z",
    limit: 10,
  })),
  getClientIpMock: vi.fn(() => "127.0.0.1"),
  hashIpMock: vi.fn(() => "hashed-ip"),
  rateLimitAuthKeyMock: vi.fn(() => "auth-key"),
  createCustomTokenFromSupabaseMock: vi.fn(),
  };
});

vi.mock("@/server/supabase", () => ({
  createAdminClient: mocks.createAdminClientMock,
  createUserClientFromBearer: mocks.createUserClientFromBearerMock,
  getBearerToken: mocks.getBearerTokenMock,
}));

vi.mock("@/server/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimitMock,
  getClientIp: mocks.getClientIpMock,
  hashIp: mocks.hashIpMock,
  rateLimitAuthKey: mocks.rateLimitAuthKeyMock,
}));

vi.mock("@/server/auth/dual-auth", () => ({
  createCustomTokenFromSupabase: mocks.createCustomTokenFromSupabaseMock,
}));

import { OPTIONS, POST } from "../../src/app/api/auth/token/route";

describe("/api/auth/token origin policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.dynamicDomains = [];
    mocks.state.dynamicSites = [];
    process.env.ALLOWED_WEB_ORIGINS = "https://dashboard.prosektor.com,https://staging.prosektor.com";
  });

  afterEach(() => {
    delete process.env.ALLOWED_WEB_ORIGINS;
  });

  it("rejects POST from disallowed origin", async () => {
    const req = new Request("http://localhost/api/auth/token", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ rememberMe: false }),
    });

    const response = await POST(req as never);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("FORBIDDEN");
    expect(mocks.enforceRateLimitMock).not.toHaveBeenCalled();
  });

  it("allows POST from configured origin and proceeds to auth checks", async () => {
    const req = new Request("http://localhost/api/auth/token", {
      method: "POST",
      headers: {
        origin: "https://dashboard.prosektor.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ rememberMe: false }),
    });

    const response = await POST(req as never);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(response.headers.get("access-control-allow-origin")).toBe("https://dashboard.prosektor.com");
    expect(response.headers.get("vary")).toBe("Origin");
    expect(mocks.enforceRateLimitMock).toHaveBeenCalled();
  });

  it("returns CORS headers for allowed preflight origin", async () => {
    const req = new Request("http://localhost/api/auth/token", {
      method: "OPTIONS",
      headers: {
        origin: "https://staging.prosektor.com",
      },
    });

    const response = await OPTIONS(req as never);
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://staging.prosektor.com");
    expect(response.headers.get("vary")).toBe("Origin");
  });

  it("rejects preflight for disallowed origin", async () => {
    const req = new Request("http://localhost/api/auth/token", {
      method: "OPTIONS",
      headers: {
        origin: "https://evil.example",
      },
    });

    const response = await OPTIONS(req as never);
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("vary")).toBe("Origin");
  });

  it("allows origin automatically when matching site/domain data exists", async () => {
    process.env.ALLOWED_WEB_ORIGINS = "";
    mocks.state.dynamicDomains.push({ domain: "autosite.example.com", status: "pending" });

    const req = new Request("http://localhost/api/auth/token", {
      method: "POST",
      headers: {
        origin: "https://autosite.example.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ rememberMe: false }),
    });

    const response = await POST(req as never);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(response.headers.get("access-control-allow-origin")).toBe("https://autosite.example.com");
    expect(mocks.enforceRateLimitMock).toHaveBeenCalled();
  });

  it("allows origin automatically when matching site primary_domain exists", async () => {
    process.env.ALLOWED_WEB_ORIGINS = "";
    mocks.state.dynamicSites.push({ primary_domain: "portal.example.com" });

    const req = new Request("http://localhost/api/auth/token", {
      method: "POST",
      headers: {
        origin: "https://portal.example.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ rememberMe: false }),
    });

    const response = await POST(req as never);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(response.headers.get("access-control-allow-origin")).toBe("https://portal.example.com");
    expect(mocks.enforceRateLimitMock).toHaveBeenCalled();
  });
});
