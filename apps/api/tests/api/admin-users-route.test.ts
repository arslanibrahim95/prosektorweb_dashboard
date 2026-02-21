import { beforeEach, describe, expect, it, vi } from "vitest";

const TENANT_ID = "aaaaaaaa-0000-4000-8001-000000000001";
const USER_ID = "aaaaaaaa-0000-4000-8001-000000000002";

const mocks = vi.hoisted(() => {
  const requireAuthContextMock = vi.fn();
  const getServerEnvMock = vi.fn(() => ({
    dashboardReadRateLimit: 50,
    dashboardReadRateWindowSec: 60,
  }));
  const enforceRateLimitMock = vi.fn();
  const rateLimitAuthKeyMock = vi.fn(() => "rl:auth:admin_users");
  const rateLimitHeadersMock = vi.fn(() => ({
    "x-ratelimit-limit": "50",
    "x-ratelimit-remaining": "49",
    "x-ratelimit-reset": "1700000000",
  }));

  return {
    requireAuthContextMock,
    getServerEnvMock,
    enforceRateLimitMock,
    rateLimitAuthKeyMock,
    rateLimitHeadersMock,
  };
});

vi.mock("@/server/auth/context", () => ({
  requireAuthContext: mocks.requireAuthContextMock,
}));

vi.mock("@/server/env", () => ({
  getServerEnv: mocks.getServerEnvMock,
}));

vi.mock("@/server/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimitMock,
  rateLimitAuthKey: mocks.rateLimitAuthKeyMock,
  rateLimitHeaders: mocks.rateLimitHeadersMock,
}));

import { GET } from "../../src/app/api/admin/users/route";

function makeContext(rpcMock: ReturnType<typeof vi.fn>, role: "owner" | "admin" | "editor" | "viewer" = "admin") {
  return {
    supabase: {} as never,
    admin: {
      rpc: rpcMock,
    } as never,
    user: {
      id: USER_ID,
      email: "user@test.dev",
      name: "Test User",
    },
    tenant: {
      id: TENANT_ID,
      name: "Tenant",
      slug: "tenant",
      plan: "pro",
      status: "active",
    },
    role,
    permissions: [],
    activeTenantId: TENANT_ID,
    availableTenants: [],
  };
}

describe("GET /api/admin/users", () => {
  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthContextMock.mockResolvedValue(makeContext(rpcMock));
    mocks.enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetAt: "2026-02-19T00:00:00.000Z",
      limit: 50,
    });
    rpcMock.mockResolvedValue({ data: [], error: null });
  });

  it("calls RPC with normalized filters and returns mapped users with filtered total", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "aaaaaaaa-0000-4000-8001-000000000010",
          tenant_id: TENANT_ID,
          user_id: "aaaaaaaa-0000-4000-8001-000000000100",
          role: "viewer",
          created_at: "2026-02-19T12:00:00.000Z",
          email: "ali@example.com",
          name: "Ali Veli",
          avatar_url: null,
          invited_at: "2026-02-18T12:00:00.000Z",
          last_sign_in_at: "2026-02-19T12:30:00.000Z",
          total_count: 2,
        },
        {
          id: "aaaaaaaa-0000-4000-8001-000000000011",
          tenant_id: TENANT_ID,
          user_id: "aaaaaaaa-0000-4000-8001-000000000101",
          role: "viewer",
          created_at: "2026-02-19T11:00:00.000Z",
          email: "ayse@example.com",
          name: "Ayse",
          avatar_url: "https://example.com/avatar.png",
          invited_at: "2026-02-18T08:00:00.000Z",
          last_sign_in_at: null,
          total_count: 2,
        },
      ],
      error: null,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/admin/users?search=%20Ali%20&role=member&status=active&page=2&limit=10&sort=role&order=asc",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.total).toBe(2);
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].user).toEqual(
      expect.objectContaining({
        id: "aaaaaaaa-0000-4000-8001-000000000100",
        email: "ali@example.com",
        name: "Ali Veli",
        last_sign_in_at: "2026-02-19T12:30:00.000Z",
      }),
    );
    expect(response.headers.get("x-ratelimit-limit")).toBe("50");

    expect(rpcMock).toHaveBeenCalledWith("admin_list_tenant_users", {
      _tenant_id: TENANT_ID,
      _search: "Ali",
      _role: "viewer",
      _status: "active",
      _sort: "role",
      _order: "asc",
      _limit: 10,
      _offset: 10,
    });
  });

  it("falls back to safe defaults for invalid query params", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/admin/users?status=unknown&sort=random&order=nope&page=-1&limit=1000&search=%20%20",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toEqual([]);
    expect(payload.total).toBe(0);

    expect(rpcMock).toHaveBeenCalledWith("admin_list_tenant_users", {
      _tenant_id: TENANT_ID,
      _search: null,
      _role: null,
      _status: null,
      _sort: "created_at",
      _order: "desc",
      _limit: 100,
      _offset: 0,
    });
  });

  it("returns 400 for invalid role filter before hitting RPC", async () => {
    const response = await GET(new Request("http://localhost/api/admin/users?role=bad-role"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("maps RPC permission errors via mapPostgrestError", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: "insufficient privilege",
        details: null,
        hint: null,
      },
    });

    const response = await GET(new Request("http://localhost/api/admin/users"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("FORBIDDEN");
  });

  it("blocks non-admin roles", async () => {
    mocks.requireAuthContextMock.mockResolvedValue(makeContext(rpcMock, "viewer"));

    const response = await GET(new Request("http://localhost/api/admin/users"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("FORBIDDEN");
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
