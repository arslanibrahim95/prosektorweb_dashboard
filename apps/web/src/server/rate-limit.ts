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

export function getClientIp(req: Request): string {
  const header =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip");
  if (!header) return "0.0.0.0";

  // `x-forwarded-for` can be a comma-separated list.
  return header.split(",")[0].trim() || "0.0.0.0";
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

export async function enforceRateLimit(
  admin: SupabaseClient,
  key: string,
  limit: number = 5,
  windowSeconds: number = 3600,
): Promise<void> {
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

  if (!parsed.data.allowed) {
    throw new HttpError(429, { code: "RATE_LIMITED", message: "Too many requests" });
  }
}
