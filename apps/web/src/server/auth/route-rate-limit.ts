import type { AuthContext } from "@/server/auth/context";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, type RateLimitResult } from "@/server/rate-limit";

const AUTH_WRITE_LIMIT = 30;
const AUTH_WRITE_WINDOW_SECONDS = 3600;

export type AuthRateLimitPreset = "read" | "search" | "write";

interface AuthRateLimitConfig {
  limit: number;
  windowSeconds: number;
}

function normalizePathSegment(segment: string): string {
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidLike.test(segment)) return ":id";
  if (/^\d+$/.test(segment)) return ":id";
  return segment.toLowerCase();
}

function endpointFromRequest(req: Request): string {
  const pathname = new URL(req.url).pathname;
  const normalized = pathname
    .replace(/^\/+/, "")
    .replace(/^api\/?/, "")
    .split("/")
    .filter((part) => part.length > 0)
    .map(normalizePathSegment)
    .join("_");

  return normalized || "api";
}

function resolvePreset(req: Request): AuthRateLimitPreset {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    const url = new URL(req.url);
    const hasSearch = Boolean(url.searchParams.get("search"));
    return hasSearch ? "search" : "read";
  }
  return "write";
}

function resolveConfig(preset: AuthRateLimitPreset): AuthRateLimitConfig {
  const env = getServerEnv();
  if (preset === "read") {
    return {
      limit: env.dashboardReadRateLimit,
      windowSeconds: env.dashboardReadRateWindowSec,
    };
  }
  if (preset === "search") {
    return {
      limit: env.dashboardSearchRateLimit,
      windowSeconds: env.dashboardSearchRateWindowSec,
    };
  }
  return {
    limit: AUTH_WRITE_LIMIT,
    windowSeconds: AUTH_WRITE_WINDOW_SECONDS,
  };
}

/**
 * Default rate-limit guard for authenticated dashboard routes.
 * Endpoint key is derived from request pathname and method-based preset.
 */
export async function enforceAuthRouteRateLimit(
  ctx: Pick<AuthContext, "admin" | "tenant" | "user">,
  req: Request,
  preset?: AuthRateLimitPreset,
): Promise<RateLimitResult> {
  const resolvedPreset = preset ?? resolvePreset(req);
  const config = resolveConfig(resolvedPreset);
  const endpoint = `${resolvedPreset}_${req.method.toLowerCase()}_${endpointFromRequest(req)}`;

  return enforceRateLimit(
    ctx.admin,
    rateLimitAuthKey(endpoint, ctx.tenant.id, ctx.user.id),
    config.limit,
    config.windowSeconds,
  );
}
