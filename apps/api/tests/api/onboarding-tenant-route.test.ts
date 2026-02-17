import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/server/api/http";

const USER_ID = "aaaaaaaa-0000-4000-8001-000000000001";
const TENANT_ID = "bbbbbbbb-0000-4000-8001-000000000001";

const mocks = vi.hoisted(() => {
  const getUserMock = vi.fn();
  const rpcMock = vi.fn();
  const getBearerTokenMock = vi.fn();
  const createAdminClientMock = vi.fn(() => ({
    auth: {
      getUser: getUserMock,
    },
    rpc: rpcMock,
  }));

  const enforceRateLimitMock = vi.fn();
  const rateLimitAuthKeyMock = vi.fn(() => "rl:onboarding-tenant:global:user");
  const rateLimitHeadersMock = vi.fn(() => ({
    "x-ratelimit-limit": "3",
    "x-ratelimit-remaining": "2",
    "x-ratelimit-reset": "1700000000",
  }));

  return {
    getUserMock,
    rpcMock,
    getBearerTokenMock,
    createAdminClientMock,
    enforceRateLimitMock,
    rateLimitAuthKeyMock,
    rateLimitHeadersMock,
  };
});

vi.mock("@/server/supabase", () => ({
  createAdminClient: mocks.createAdminClientMock,
  getBearerToken: mocks.getBearerTokenMock,
}));

vi.mock("@/server/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimitMock,
  rateLimitAuthKey: mocks.rateLimitAuthKeyMock,
  rateLimitHeaders: mocks.rateLimitHeadersMock,
}));

import { POST } from "../../src/app/api/onboarding/tenant/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/onboarding/tenant", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/onboarding/tenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getBearerTokenMock.mockReturnValue("valid-token");
    mocks.getUserMock.mockResolvedValue({
      data: {
        user: {
          id: USER_ID,
        },
      },
      error: null,
    });
    mocks.enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 2,
      resetAt: "2026-02-12T00:00:00.000Z",
      limit: 3,
    });
    mocks.rpcMock.mockResolvedValue({
      data: [
        {
          id: TENANT_ID,
          name: "Acme Corp",
          slug: "acme-corp",
          plan: "demo",
        },
      ],
      error: null,
    });
  });

  it("returns 401 when bearer token is missing", async () => {
    mocks.getBearerTokenMock.mockReturnValue(null);

    const response = await POST(makeRequest({ name: "Acme" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(mocks.getUserMock).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", async () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid jwt" },
    });

    const response = await POST(makeRequest({ name: "Acme" }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(mocks.enforceRateLimitMock).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(makeRequest({ name: "" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details.name).toBeDefined();
    expect(mocks.rpcMock).not.toHaveBeenCalled();
  });

  it("passes normalized slug to RPC and returns 201 with rate limit headers", async () => {
    const response = await POST(
      makeRequest({
        name: "  Acme   Holding  ",
        slug: "Özel   Şirket URL",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.id).toBe(TENANT_ID);
    expect(payload.slug).toBe("acme-corp");
    expect(response.headers.get("x-ratelimit-limit")).toBe("3");
    expect(mocks.rpcMock).toHaveBeenCalledWith(
      "create_onboarding_tenant",
      expect.objectContaining({
        _user_id: USER_ID,
        _name: "Acme Holding",
        _preferred_slug: "ozel-sirket-url",
        _max_owned_tenants: 5,
      }),
    );
  });

  it("maps owned-tenant-limit RPC error to 403", async () => {
    mocks.rpcMock.mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: "owned tenant limit exceeded",
        details: null,
        hint: null,
      },
    });

    const response = await POST(makeRequest({ name: "Acme" }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("FORBIDDEN");
  });

  it("maps slug conflict RPC error to 409", async () => {
    mocks.rpcMock.mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: "duplicate key value violates unique constraint \"tenants_slug_key\"",
        details: "Key (slug)=(acme) already exists.",
        hint: null,
      },
    });

    const response = await POST(makeRequest({ name: "Acme" }));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.code).toBe("CONFLICT");
  });

  it("preserves 429 headers from rate limiter errors", async () => {
    mocks.enforceRateLimitMock.mockRejectedValue(
      new HttpError(
        429,
        { code: "RATE_LIMITED", message: "Too many requests" },
        { headers: { "retry-after": "60" } },
      ),
    );

    const response = await POST(makeRequest({ name: "Acme" }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.code).toBe("RATE_LIMITED");
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("returns 500 when RPC response shape is invalid", async () => {
    mocks.rpcMock.mockResolvedValue({
      data: [{ foo: "bar" }],
      error: null,
    });

    const response = await POST(makeRequest({ name: "Acme" }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.code).toBe("INTERNAL_ERROR");
  });
});
