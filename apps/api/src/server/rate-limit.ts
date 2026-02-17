import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { isIP } from "net";
import { z } from "zod";
import { getServerEnv } from "./env";
import { HttpError, mapPostgrestError } from "./api/http";

// Validation constants
const MIN_RATE_LIMIT = 1;
const MAX_RATE_LIMIT = 10000;
const MIN_WINDOW_SECONDS = 1;
const MAX_WINDOW_SECONDS = 86400; // 24 hours

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

function normalizeValidIp(value: string | null): string | null {
  if (!value) return null;
  const candidate = value.trim();
  if (candidate.length === 0) return null;
  return isIP(candidate) ? candidate : null;
}

function firstForwardedIp(forwardedFor: string): string | null {
  const chain = forwardedFor
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

  for (const ip of chain) {
    const valid = normalizeValidIp(ip);
    if (valid) return valid;
  }

  return null;
}

export function getClientIp(req: Request): string {
  const cloudflareIp = normalizeValidIp(req.headers.get("cf-connecting-ip"));
  if (cloudflareIp) return cloudflareIp;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const forwardedIp = firstForwardedIp(forwardedFor);
    if (forwardedIp) return forwardedIp;
  }

  return "0.0.0.0";
}

export function hashIp(ip: string): string {
  const env = getServerEnv();
  return createHash("sha256").update(ip + env.siteTokenSecret).digest("base64url");
}

export function randomId(bytes: number = 8): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Validates rate limit parameters to prevent invalid values
 */
function validateRateLimitParams(limit: number, windowSeconds: number): void {
  if (!Number.isFinite(limit) || limit < MIN_RATE_LIMIT || limit > MAX_RATE_LIMIT) {
    throw new Error(`Invalid rate limit: must be between ${MIN_RATE_LIMIT} and ${MAX_RATE_LIMIT}`);
  }
  if (!Number.isFinite(windowSeconds) || windowSeconds < MIN_WINDOW_SECONDS || windowSeconds > MAX_WINDOW_SECONDS) {
    throw new Error(`Invalid window: must be between ${MIN_WINDOW_SECONDS} and ${MAX_WINDOW_SECONDS} seconds`);
  }
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
  // Validate parameters before making DB call
  validateRateLimitParams(limit, windowSeconds);

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
