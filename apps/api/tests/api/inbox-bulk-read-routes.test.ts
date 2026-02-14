import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthContext } from "@/server/auth/context";
import { POST as postOffersBulkRead } from "../../src/app/api/inbox/offers/bulk-read/route";
import { POST as postContactBulkRead } from "../../src/app/api/inbox/contact/bulk-read/route";
import { POST as postApplicationsBulkRead } from "../../src/app/api/inbox/applications/bulk-read/route";

vi.mock("@/server/auth/context", () => ({
  requireAuthContext: vi.fn(),
}));

const TENANT_ID = "aaaaaaaa-0000-4000-8001-000000000001";
const IDS = [
  "aaaaaaaa-0000-4000-8001-000000000010",
  "aaaaaaaa-0000-4000-8001-000000000011",
];

interface QueryBuilderMocks {
  from: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  inFilter: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
}

function createSupabaseMocks(updatedCount: number): QueryBuilderMocks {
  const select = vi.fn().mockResolvedValue({
    data: Array.from({ length: updatedCount }).map((_, index) => ({ id: `id-${index}` })),
    error: null,
  });
  const inFilter = vi.fn().mockReturnValue({ select });
  const eq = vi.fn().mockReturnValue({ in: inFilter });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });

  return { from, update, eq, inFilter, select };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/inbox/bulk-read", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const cases = [
  {
    label: "offers",
    table: "offer_requests",
    handler: postOffersBulkRead,
  },
  {
    label: "contact",
    table: "contact_messages",
    handler: postContactBulkRead,
  },
  {
    label: "applications",
    table: "job_applications",
    handler: postApplicationsBulkRead,
  },
] as const;

describe.each(cases)("POST /api/inbox/%s/bulk-read", ({ table, handler }) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates ids, scopes by tenant, and returns updated count", async () => {
    const supabase = createSupabaseMocks(2);

    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: {
        from: supabase.from,
      } as never,
      admin: {} as never,
      user: {
        id: "aaaaaaaa-0000-4000-8001-000000000099",
        email: "user@test.dev",
        name: "Test User",
      },
      tenant: {
        id: TENANT_ID,
        name: "Tenant",
        slug: "tenant",
        plan: "pro",
      },
      role: "admin",
      permissions: [],
    });

    const response = await handler(makeRequest({ ids: IDS }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ updated: 2 });
    expect(supabase.from).toHaveBeenCalledWith(table);
    expect(supabase.update).toHaveBeenCalledWith({ is_read: true });
    expect(supabase.eq).toHaveBeenCalledWith("tenant_id", TENANT_ID);
    expect(supabase.inFilter).toHaveBeenCalledWith("id", IDS);
    expect(supabase.select).toHaveBeenCalledWith("id");
  });

  it("returns 400 for invalid id list", async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      supabase: {
        from: vi.fn(),
      } as never,
      admin: {} as never,
      user: {
        id: "aaaaaaaa-0000-4000-8001-000000000099",
        email: "user@test.dev",
        name: "Test User",
      },
      tenant: {
        id: TENANT_ID,
        name: "Tenant",
        slug: "tenant",
        plan: "pro",
      },
      role: "admin",
      permissions: [],
    });

    const response = await handler(makeRequest({ ids: [] }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("VALIDATION_ERROR");
  });
});
