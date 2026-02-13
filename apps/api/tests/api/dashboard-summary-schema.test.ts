import { describe, expect, it } from "vitest";
import { dashboardSummaryResponseSchema } from "@prosektor/contracts";

describe("dashboard summary schema", () => {
  it("validates dashboard summary payload", () => {
    const payload = {
      totals: {
        offers: 12,
        contacts: 8,
        applications: 5,
      },
      active_job_posts_count: 3,
      primary_domain_status: {
        status: "active",
        ssl_status: "issued",
      },
      recent_activity: [
        {
          id: "123e4567-e89b-42d3-a456-426614174000",
          type: "offer",
          name: "Ada Yilmaz",
          detail: "Teklif",
          created_at: "2026-02-11T10:00:00Z",
        },
      ],
    };

    expect(dashboardSummaryResponseSchema.safeParse(payload).success).toBe(true);
  });
});
