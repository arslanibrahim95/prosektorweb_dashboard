import { describe, expect, it } from "vitest";
import {
  createAdminApiKeyRequestSchema,
  createAdminReportRequestSchema,
  deleteAdminReportQuerySchema,
  listAdminApiKeysQuerySchema,
  listAdminReportsQuerySchema,
  updateAdminApiKeyRequestSchema,
} from "../index";

describe("admin contracts", () => {
  describe("api keys", () => {
    it("accepts valid list query", () => {
      const parsed = listAdminApiKeysQuerySchema.safeParse({ page: "1", limit: "20" });
      expect(parsed.success).toBe(true);
    });

    it("accepts valid create payload", () => {
      const parsed = createAdminApiKeyRequestSchema.safeParse({
        name: "Primary key",
        permissions: ["read", "write"],
        rate_limit: 500,
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects empty update payload", () => {
      const parsed = updateAdminApiKeyRequestSchema.safeParse({});
      expect(parsed.success).toBe(false);
    });
  });

  describe("reports", () => {
    it("accepts valid list query", () => {
      const parsed = listAdminReportsQuerySchema.safeParse({
        page: "1",
        limit: "20",
        type: "analytics",
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts valid create payload", () => {
      const parsed = createAdminReportRequestSchema.safeParse({
        name: "Weekly Analytics",
        type: "analytics",
        format: "csv",
        parameters: { period: "7d" },
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects delete query without id", () => {
      const parsed = deleteAdminReportQuerySchema.safeParse({});
      expect(parsed.success).toBe(false);
    });
  });
});

