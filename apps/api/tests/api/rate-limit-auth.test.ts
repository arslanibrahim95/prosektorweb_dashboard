import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "../../src/server/api/http";
import {
  enforceRateLimit,
  rateLimitAuthKey,
  rateLimitHeaders,
} from "../../src/server/rate-limit";

describe("rate limit auth helpers", () => {
  it("builds auth-scoped rate limit keys", () => {
    // SECURITY: User ID is hashed for privacy (KVKK/GDPR compliance)
    const key = rateLimitAuthKey("inbox_offers_list", "tenant-1", "user-1");
    expect(key).toMatch(/^rl:auth:inbox_offers_list:tenant-1:[a-f0-9]{16}$/);
    expect(key).not.toContain("user-1"); // PII should not be in the key
  });

  it("returns metadata when allowed", async () => {
    const admin = {
      rpc: vi.fn().mockResolvedValue({
        data: { allowed: true, remaining: 7, reset_at: "2026-02-12T00:00:00.000Z" },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await enforceRateLimit(admin, "rl:key", 10, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
    expect(result.limit).toBe(10);
  });

  it("throws HttpError with rate-limit headers when denied", async () => {
    const admin = {
      rpc: vi.fn().mockResolvedValue({
        data: { allowed: false, remaining: 0, reset_at: "2026-02-12T00:00:00.000Z" },
        error: null,
      }),
    } as unknown as SupabaseClient;

    await expect(enforceRateLimit(admin, "rl:key", 3, 600)).rejects.toBeInstanceOf(HttpError);

    try {
      await enforceRateLimit(admin, "rl:key", 3, 600);
    } catch (error) {
      const httpError = error as HttpError;
      expect(httpError.status).toBe(429);
      expect(httpError.headers).toBeDefined();
      expect((httpError.headers as Record<string, string>)["retry-after"]).toBeDefined();
      expect((httpError.headers as Record<string, string>)["x-ratelimit-limit"]).toBe("3");
    }
  });

  it("builds standard rate-limit headers", () => {
    const headers = rateLimitHeaders(
      { limit: 10, remaining: 4, resetAt: "2026-02-12T00:00:00.000Z" },
      { includeRetryAfter: true },
    );
    expect(headers["x-ratelimit-limit"]).toBe("10");
    expect(headers["x-ratelimit-remaining"]).toBe("4");
    expect(headers["x-ratelimit-reset"]).toBeDefined();
    expect(headers["retry-after"]).toBeDefined();
  });
});
