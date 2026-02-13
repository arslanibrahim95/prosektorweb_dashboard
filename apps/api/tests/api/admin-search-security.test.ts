import { describe, expect, it } from "vitest";
import { adminContentPagesQuerySchema } from "../../src/app/api/admin/content/pages/route";
import { adminContentPostsQuerySchema } from "../../src/app/api/admin/content/posts/route";
import { adminLogsQuerySchema } from "../../src/app/api/admin/logs/route";

describe("admin search security", () => {
  it("rejects PostgREST control characters in admin search params", () => {
    const injection = "foo,is_read.eq.true";
    const closingParen = "foo)or(is_read.eq.true";

    const schemas = [
      adminContentPagesQuerySchema,
      adminContentPostsQuerySchema,
      adminLogsQuerySchema,
    ];

    for (const schema of schemas) {
      expect(schema.safeParse({ search: injection }).success).toBe(false);
      expect(schema.safeParse({ search: closingParen }).success).toBe(false);
    }
  });

  it("accepts safe search and validates pagination", () => {
    expect(
      adminContentPagesQuerySchema.safeParse({
        search: "john.doe+acme",
        page: 1,
        limit: 20,
      }).success,
    ).toBe(true);

    expect(
      adminContentPostsQuerySchema.safeParse({
        search: "startup team",
        status: "active",
        page: 2,
        limit: 10,
      }).success,
    ).toBe(true);

    expect(
      adminLogsQuerySchema.safeParse({
        search: "domain update",
        level: "warning",
        page: 1,
        limit: 50,
      }).success,
    ).toBe(true);
  });
});
