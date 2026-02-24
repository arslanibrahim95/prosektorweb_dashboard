import { asErrorBody, asHeaders, asStatus, jsonError } from "@/server/api/http";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, type RateLimitResult } from "@/server/rate-limit";
import type { AuthContext } from "@/server/auth/context";

export type AdminRateLimitPreset = "read" | "search" | "export" | "write";

export interface AdminRateLimitConfig {
  limit: number;
  windowSeconds: number;
}

function resolveRateLimitConfig(
  input: AdminRateLimitPreset | AdminRateLimitConfig,
): AdminRateLimitConfig {
  if (typeof input !== "string") return input;

  const env = getServerEnv();
  if (input === "read") {
    return {
      limit: env.dashboardReadRateLimit,
      windowSeconds: env.dashboardReadRateWindowSec,
    };
  }
  if (input === "write") {
    return { limit: 30, windowSeconds: 3600 };
  }
  if (input === "search") {
    return {
      limit: env.dashboardSearchRateLimit,
      windowSeconds: env.dashboardSearchRateWindowSec,
    };
  }
  return {
    limit: env.dashboardExportRateLimit,
    windowSeconds: env.dashboardExportRateWindowSec,
  };
}

/**
 * Standardized rate-limit enforcement for authenticated admin routes.
 */
export async function enforceAdminRateLimit(
  ctx: Pick<AuthContext, "admin" | "tenant" | "user">,
  endpoint: string,
  config: AdminRateLimitPreset | AdminRateLimitConfig = "read",
): Promise<RateLimitResult> {
  const resolved = resolveRateLimitConfig(config);
  return enforceRateLimit(
    ctx.admin,
    rateLimitAuthKey(endpoint, ctx.tenant.id, ctx.user.id),
    resolved.limit,
    resolved.windowSeconds,
  );
}

/**
 * Standardized error response for admin routes.
 */
export function handleAdminRouteError(err: unknown): Response {
  return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
}

/**
 * Tiny wrapper that normalizes admin route error responses.
 */
export function withAdminErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return handleAdminRouteError(err);
    }
  };
}
