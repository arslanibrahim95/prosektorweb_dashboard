import { describe, expect, it } from "vitest";
import { inboxOffersQuerySchema } from "../../src/app/api/inbox/offers/route";
import { inboxContactQuerySchema } from "../../src/app/api/inbox/contact/route";
import { inboxApplicationsQuerySchema } from "../../src/app/api/inbox/hr-applications/route";
import { exportOffersQuerySchema } from "../../src/app/api/inbox/offers/export/route";
import { exportContactQuerySchema } from "../../src/app/api/inbox/contact/export/route";
import { exportApplicationsQuerySchema } from "../../src/app/api/inbox/applications/export/route";

const siteId = "aaaaaaaa-0000-4000-8001-000000000001";

describe("inbox query validation", () => {
  it("rejects list limit > 100", () => {
    expect(inboxOffersQuerySchema.safeParse({ site_id: siteId, limit: 101 }).success).toBe(false);
    expect(inboxContactQuerySchema.safeParse({ site_id: siteId, limit: 101 }).success).toBe(false);
    expect(inboxApplicationsQuerySchema.safeParse({ site_id: siteId, limit: 101 }).success).toBe(
      false,
    );
  });

  it("rejects one-character search on list endpoints", () => {
    expect(inboxOffersQuerySchema.safeParse({ site_id: siteId, search: "a" }).success).toBe(false);
    expect(inboxContactQuerySchema.safeParse({ site_id: siteId, search: "a" }).success).toBe(false);
    expect(
      inboxApplicationsQuerySchema.safeParse({ site_id: siteId, search: "a" }).success,
    ).toBe(false);
  });

  it("accepts two-character search on list endpoints", () => {
    expect(inboxOffersQuerySchema.safeParse({ site_id: siteId, search: "ab" }).success).toBe(true);
    expect(inboxContactQuerySchema.safeParse({ site_id: siteId, search: "ab" }).success).toBe(true);
    expect(
      inboxApplicationsQuerySchema.safeParse({ site_id: siteId, search: "ab" }).success,
    ).toBe(true);
  });

  it("requires site_id and enforces max export limit", () => {
    expect(exportOffersQuerySchema.safeParse({ limit: 1000 }).success).toBe(false);
    expect(exportContactQuerySchema.safeParse({ limit: 1000 }).success).toBe(false);
    expect(exportApplicationsQuerySchema.safeParse({ limit: 1000 }).success).toBe(false);

    expect(exportOffersQuerySchema.safeParse({ site_id: siteId, limit: 2001 }).success).toBe(false);
    expect(exportContactQuerySchema.safeParse({ site_id: siteId, limit: 2001 }).success).toBe(
      false,
    );
    expect(
      exportApplicationsQuerySchema.safeParse({ site_id: siteId, limit: 2001 }).success,
    ).toBe(false);
  });
});
