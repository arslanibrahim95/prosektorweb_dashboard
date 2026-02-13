import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { getServerEnv } from "./env";
import { HttpError, mapPostgrestError } from "./api/http";

const rateLimitRpcResponseSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number().int(),
  reset_at: z.string(),
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
}

export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const chain = forwardedFor
      .split(",")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);
    if (chain.length > 0) return chain[chain.length - 1];
  }

  const cloudflareIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  return "0.0.0.0";
}

export function hashIp(ip: string): string {
  const env = getServerEnv();
  return createHash("sha256").update(ip + env.siteTokenSecret).digest("base64url");
}

export function randomId(bytes: number = 8): string {
  return randomBytes(bytes).toString("hex");
}

export function rateLimitKey(endpoint: string, siteId: string, ipHash: string): string {
  return `rl:${endpoint}:${siteId}:${ipHash}`;
}

export function rateLimitAuthKey(endpoint: string, tenantId: string, userId: string): string {
  return `rl:auth:${endpoint}:${tenantId}:${userId}`;
}

export function rateLimitHeaders(
  result: Pick<RateLimitResult, "limit" | "remaining" | "resetAt">,
  opts?: { includeRetryAfter?: boolean },
): Record<string, string> {
  const nowSec = Math.ceil(Date.now() / 1000);
  const resetSecRaw = Math.ceil(new Date(result.resetAt).getTime() / 1000);
  const resetSec = Number.isFinite(resetSecRaw) ? Math.max(resetSecRaw, nowSec) : nowSec;
  const retryAfterSec = Math.max(resetSec - nowSec, 0);

  const headers: Record<string, string> = {
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(resetSec),
  };

  if (opts?.includeRetryAfter) {
    headers["retry-after"] = String(retryAfterSec);
  }

  return headers;
}

export async function enforceRateLimit(
  admin: SupabaseClient,
  key: string,
  limit: number = 5,
  windowSeconds: number = 3600,
): Promise<RateLimitResult> {
  const { data, error } = await admin.rpc("check_rate_limit", {
    _key: key,
    _limit: limit,
    _window_seconds: windowSeconds,
  });

  if (error) throw mapPostgrestError(error);

  const row = Array.isArray(data) ? data[0] : data;
  const parsed = rateLimitRpcResponseSchema.safeParse(row);
  if (!parsed.success) {
    throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Invalid rate limit response" });
  }

  const result: RateLimitResult = {
    allowed: parsed.data.allowed,
    remaining: parsed.data.remaining,
    resetAt: parsed.data.reset_at,
    limit,
  };

  if (!result.allowed) {
    throw new HttpError(
      429,
      { code: "RATE_LIMITED", message: "Too many requests" },
      { headers: rateLimitHeaders(result, { includeRetryAfter: true }) },
    );
  }

  return result;
}
