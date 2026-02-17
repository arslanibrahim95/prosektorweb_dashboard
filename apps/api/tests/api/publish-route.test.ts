import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../src/app/api/publish/route";
import { requireAuthContext } from "@/server/auth/context";
import { sendPublishWebhook } from "@/server/webhooks/publish";

vi.mock("@/server/auth/context", () => ({
  requireAuthContext: vi.fn(),
}));

vi.mock("@/server/webhooks/publish", () => ({
  sendPublishWebhook: vi.fn(),
}));

const TENANT_ID = "aaaaaaaa-0000-4000-8001-000000000001";
const USER_ID = "aaaaaaaa-0000-4000-8001-000000000002";
const SITE_ID = "aaaaaaaa-0000-4000-8001-000000000003";
const PAGE_ID = "aaaaaaaa-0000-4000-8001-000000000004";

function makeRequest(environment: "staging" | "production") {
  return new Request("http://localhost/api/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      site_id: SITE_ID,
      environment,
    }),
  });
}

describe("POST /api/publish", () => {
  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.mocked(requireAuthContext).mockResolvedValue({
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
      role: "admin",
      permissions: [],
      activeTenantId: TENANT_ID,
      availableTenants: [],
    });
  });

  it("calls publish RPC once and returns publish response", async () => {
    rpcMock.mockResolvedValue({
      data: {
        site_id: SITE_ID,
        tenant_id: TENANT_ID,
        status: "staging",
        webhook_slug: "demo.example.com",
        page_ids: [PAGE_ID],
      },
      error: null,
    });
    vi.mocked(sendPublishWebhook).mockResolvedValue(undefined);

    const response = await POST(makeRequest("staging"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.site_id).toBe(SITE_ID);
    expect(payload.environment).toBe("staging");
    expect(typeof payload.published_at).toBe("string");

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "publish_site",
      expect.objectContaining({
        _tenant_id: TENANT_ID,
        _site_id: SITE_ID,
        _environment: "staging",
        _actor_id: USER_ID,
      }),
    );

    expect(sendPublishWebhook).toHaveBeenCalledTimes(1);
    const webhookPayload = vi.mocked(sendPublishWebhook).mock.calls[0][0];
    expect(webhookPayload.traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(webhookPayload.pages).toEqual([PAGE_ID]);
  });

  it("maps invalid state RPC error to 409 response", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        code: "P0001",
        message: "Site must be staging first",
      },
    });

    const response = await POST(makeRequest("production"));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.code).toBe("INVALID_STATE");
    expect(sendPublishWebhook).not.toHaveBeenCalled();
  });

  it("does not wait for webhook dispatch", async () => {
    rpcMock.mockResolvedValue({
      data: {
        site_id: SITE_ID,
        tenant_id: TENANT_ID,
        status: "staging",
        webhook_slug: "demo.example.com",
        page_ids: [PAGE_ID],
      },
      error: null,
    });
    vi.mocked(sendPublishWebhook).mockReturnValue(
      new Promise<void>(() => {
        // intentionally unresolved to assert non-blocking behavior
      }),
    );

    const result = await Promise.race([
      POST(makeRequest("staging")).then(() => "resolved"),
      new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 50)),
    ]);

    expect(result).toBe("resolved");
  });
});
