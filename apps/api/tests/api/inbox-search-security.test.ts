import { describe, expect, it } from "vitest";
import { inboxOffersQuerySchema } from "../../src/app/api/inbox/offers/route";
import { inboxContactQuerySchema } from "../../src/app/api/inbox/contact/route";
import { inboxApplicationsQuerySchema } from "../../src/app/api/inbox/hr-applications/route";
import { exportOffersQuerySchema } from "../../src/app/api/inbox/offers/export/route";
import { exportContactQuerySchema } from "../../src/app/api/inbox/contact/export/route";
import { exportApplicationsQuerySchema } from "../../src/app/api/inbox/applications/export/route";
import { buildSafeIlikeOr, sanitizeSearchTerm } from "../../src/server/api/postgrest-search";

const siteId = "aaaaaaaa-0000-4000-8001-000000000001";
const validQueryBase = { site_id: siteId, search: "john.doe+acme" };

describe("inbox search security", () => {
  it("rejects PostgREST control characters in list and export schemas", () => {
    const injectionPayload = { site_id: siteId, search: "foo,is_read.eq.true" };
    const closingParenPayload = { site_id: siteId, search: "foo)or(is_read.eq.true" };

    const schemas = [
      inboxOffersQuerySchema,
      inboxContactQuerySchema,
      inboxApplicationsQuerySchema,
      exportOffersQuerySchema,
      exportContactQuerySchema,
      exportApplicationsQuerySchema,
    ];

    for (const schema of schemas) {
      expect(schema.safeParse(injectionPayload).success).toBe(false);
      expect(schema.safeParse(closingParenPayload).success).toBe(false);
    }
  });

  it("enforces max length and allowed character set", () => {
    const tooLongSearch = "a".repeat(81);
    const unsupportedCharPayload = { site_id: siteId, search: "foo'bar" };

    expect(inboxOffersQuerySchema.safeParse({ site_id: siteId, search: tooLongSearch }).success).toBe(
      false,
    );
    expect(inboxOffersQuerySchema.safeParse(unsupportedCharPayload).success).toBe(false);
    expect(inboxOffersQuerySchema.safeParse(validQueryBase).success).toBe(true);
  });

  it("escapes wildcard and backslash characters", () => {
    expect(sanitizeSearchTerm("foo%_\\bar")).toBe("foo\\%\\_\\\\bar");
  });

  it("builds safe ilike OR expression", () => {
    const expression = buildSafeIlikeOr(["full_name", "email"], "foo%bar");
    expect(expression).toBe("full_name.ilike.%foo\\%bar%,email.ilike.%foo\\%bar%");
  });
});
