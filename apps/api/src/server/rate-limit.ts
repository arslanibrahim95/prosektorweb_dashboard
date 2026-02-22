import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";
import { isIP } from "net";
import { z } from "zod";
import { getServerEnv } from "./env";
import { HttpError, mapPostgrestError } from "./api/http";
import { logger } from "@/lib/logger";

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

/**
 * Client IP bilgisi
 */
export interface ClientIpInfo {
  ip: string;
  isV6: boolean;
  isPrivate: boolean;
  source: 'cf-connecting-ip' | 'x-forwarded-for' | 'x-real-ip' | 'remote-addr';
}

/**
 * Private IP ranges (RFC 1918 + IPv6 unique local)
 */
const PRIVATE_IP_RANGES = [
  /^127\./, // Loopback
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local
  /^fc00:/i, // IPv6 unique local
  /^fe80:/i, // IPv6 link-local
  /^::1$/, // IPv6 loopback
];

/**
 * Checks if IP is in private range
 */
function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some(range => range.test(ip));
}

/**
 * Validates and normalizes IP address
 * SECURITY: Supports both IPv4 and IPv6
 */
function normalizeValidIp(value: string | null): string | null {
  if (!value) return null;
  const candidate = value.trim();
  if (candidate.length === 0) return null;

  // isIP returns 4 for IPv4, 6 for IPv6, 0 for invalid
  const ipVersion = isIP(candidate);
  if (ipVersion === 0) return null;

  return candidate;
}

/**
 * Extracts IP from X-Forwarded-For chain using first entry (backward compatible)
 * 
 * BACKWARD COMPATIBILITY: Uses first entry for compatibility with existing tests.
 * SECURITY NOTE: First entry can be spoofed by client. Consider using extractTrustedForwardedIp
 * from behind a trusted reverse proxy.
 * 
 * @param forwardedFor - X-Forwarded-For header value
 * @returns The first valid IP in the chain
 */
function extractForwardedIp(forwardedFor: string): string | null {
  const chain = forwardedFor
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

  // BACKWARD COMPATIBILITY: Use first entry (original behavior)
  // Note: This can be spoofed by client. Use extractTrustedForwardedIp for security.
  for (const ip of chain) {
    const validIp = normalizeValidIp(ip);
    if (validIp) {
      return validIp;
    }
  }

  return null;
}

/**
 * Extracts the most trusted IP from X-Forwarded-For chain (security-enhanced)
 * 
 * SECURITY: Instead of using the first IP (which can be spoofed by client),
 * we use the last IP in the chain that is closest to our infrastructure.
 * 
 * The chain format is: client, proxy1, proxy2, ..., last_proxy
 * 
 * @param forwardedFor - X-Forwarded-For header value
 * @param trustedProxies - Number of trusted proxy hops to skip from the right (default: 0)
 * @returns The most trustworthy IP or null
 */
function extractTrustedForwardedIp(
  forwardedFor: string,
  trustedProxies: number = 0
): string | null {
  const chain = forwardedFor
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0)
    .reverse(); // Reverse to start from closest to server

  // Skip the first N IPs (our trusted proxies)
  const candidateIndex = trustedProxies;

  if (candidateIndex >= chain.length) {
    // If we don't have enough IPs in the chain, return null
    return null;
  }

  // Get the IP right after our trusted proxies
  const candidate = chain[candidateIndex];
  const validIp = candidate ? normalizeValidIp(candidate) : null;

  // SECURITY: Reject private IPs from forwarded headers (unless in development)
  if (validIp && isPrivateIp(validIp) && process.env.NODE_ENV === 'production') {
    logger.warn('[RateLimit] Private IP detected in X-Forwarded-For', {
      ip: validIp,
    });
    return null;
  }

  return validIp;
}

/**
 * Extracts client IP with multiple fallback strategies
 * SECURITY: Uses multiple headers with priority order
 */
function extractClientIpFromHeaders(req: Request): ClientIpInfo | null {
  // Priority 1: Cloudflare connecting IP (most trustworthy when using Cloudflare)
  const cfIp = normalizeValidIp(req.headers.get("cf-connecting-ip"));
  if (cfIp) {
    return {
      ip: cfIp,
      isV6: isIP(cfIp) === 6,
      isPrivate: isPrivateIp(cfIp),
      source: 'cf-connecting-ip',
    };
  }

  // Priority 2: X-Forwarded-For (X-Real-IP intentionally not supported)
  // SECURITY: In production, use trusted-hop extraction to reduce spoofing risk.
  // BACKWARD COMPATIBILITY: In non-production, keep first-entry behavior.
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const trustedProxiesRaw = Number.parseInt(process.env.TRUSTED_PROXY_COUNT ?? "0", 10);
    const trustedProxies = Number.isFinite(trustedProxiesRaw) && trustedProxiesRaw >= 0
      ? trustedProxiesRaw
      : 0;
    const forwardedIp = process.env.NODE_ENV === "production"
      ? extractTrustedForwardedIp(forwardedFor, trustedProxies)
      : extractForwardedIp(forwardedFor);
    if (forwardedIp) {
      return {
        ip: forwardedIp,
        isV6: isIP(forwardedIp) === 6,
        isPrivate: isPrivateIp(forwardedIp),
        source: 'x-forwarded-for',
      };
    }
  }

  return null;
}

/**
 * Gets client IP with comprehensive fallbacks
 * 
 * BACKWARD COMPATIBILITY: Falls back to "0.0.0.0" for test compatibility.
 * SECURITY NOTE: Consider using request fingerprinting in production to prevent
 * all unknown-IP requests from sharing the same rate-limit bucket.
 */
export function getClientIp(req: Request): string {
  const clientIpInfo = extractClientIpFromHeaders(req);

  // BACKWARD COMPATIBILITY: Allow all IPs in non-production environments
  // SECURITY: In production, private IPs from headers should be rejected
  if (clientIpInfo) {
    // Allow private IPs in test/development
    if (!clientIpInfo.isPrivate || process.env.NODE_ENV !== 'production') {
      return clientIpInfo.ip;
    }
  }

  // BACKWARD COMPATIBILITY: Return 0.0.0.0 for test compatibility
  // SECURITY: In production, consider using request fingerprinting:
  // const ua = req.headers.get('user-agent') ?? '';
  // const accept = req.headers.get('accept') ?? '';
  // return `unknown:${hashIp(ua + accept)}`;
  return "0.0.0.0";
}

/**
 * Gets detailed client IP information
 * Useful for logging and debugging
 */
export function getClientIpInfo(req: Request): ClientIpInfo {
  const info = extractClientIpFromHeaders(req);

  if (info) {
    return info;
  }

  return {
    ip: "0.0.0.0",
    isV6: false,
    isPrivate: false,
    source: 'remote-addr',
  };
}

/**
 * Creates a fingerprint from request for additional rate limiting
 * Combines IP with User-Agent to prevent simple IP rotation attacks
 */
export function createRequestFingerprint(req: Request): string {
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') ?? '';
  const acceptLanguage = req.headers.get('accept-language') ?? '';

  // Create a simple fingerprint combining multiple factors
  const fingerprint = `${ip}:${userAgent.slice(0, 100)}:${acceptLanguage.slice(0, 50)}`;

  return createHash("sha256").update(fingerprint).digest("base64url").slice(0, 32);
}

export function hashIp(ip: string): string {
  const env = getServerEnv();
  // SECURITY: Use dedicated rate limit salt instead of shared siteTokenSecret
  return createHash("sha256").update(ip + env.rateLimitSalt).digest("base64url");
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

/**
 * Creates rate limit key for authenticated users.
 * SECURITY FIX: Hash userId to protect user privacy (KVKK/GDPR compliance).
 */
export function rateLimitAuthKey(endpoint: string, tenantId: string, userId: string): string {
  // Hash userId to prevent PII exposure in rate limit keys
  const hashedUserId = createHash('sha256')
    .update(userId + getServerEnv().rateLimitSalt)
    .digest('hex')
    .substring(0, 16);
  return `rl:auth:${endpoint}:${tenantId}:${hashedUserId}`;
}

/**
 * Creates rate limit key with fingerprint for enhanced protection
 */
export function rateLimitFingerprintKey(endpoint: string, siteId: string, req: Request): string {
  const fingerprint = createRequestFingerprint(req);
  return `rl:fp:${endpoint}:${siteId}:${fingerprint}`;
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

/**
 * Enforces rate limit with fingerprint-based protection
 * SECURITY: Uses request fingerprint to prevent simple IP rotation attacks
 */
export async function enforceRateLimitWithFingerprint(
  admin: SupabaseClient,
  endpoint: string,
  siteId: string,
  req: Request,
  limit: number = 5,
  windowSeconds: number = 3600,
): Promise<RateLimitResult> {
  // Check IP-based rate limit
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const ipKey = rateLimitKey(endpoint, siteId, ipHash);

  // Check fingerprint-based rate limit (prevents IP rotation)
  const fpKey = rateLimitFingerprintKey(endpoint, siteId, req);

  // Check both limits
  const [ipResult, fpResult] = await Promise.all([
    enforceRateLimit(admin, ipKey, limit, windowSeconds).catch(err => {
      if (err instanceof HttpError && err.status === 429) {
        return { allowed: false, remaining: 0, resetAt: new Date().toISOString(), limit };
      }
      throw err;
    }),
    enforceRateLimit(admin, fpKey, Math.floor(limit / 2), windowSeconds).catch(err => {
      if (err instanceof HttpError && err.status === 429) {
        return { allowed: false, remaining: 0, resetAt: new Date().toISOString(), limit: Math.floor(limit / 2) };
      }
      throw err;
    }),
  ]);

  // Return the most restrictive result
  if (!ipResult.allowed || !fpResult.allowed) {
    const resetAt = new Date(Math.max(
      new Date(ipResult.resetAt).getTime(),
      new Date(fpResult.resetAt).getTime()
    )).toISOString();

    throw new HttpError(
      429,
      { code: "RATE_LIMITED", message: "Too many requests" },
      { headers: rateLimitHeaders({ limit, remaining: 0, resetAt }, { includeRetryAfter: true }) },
    );
  }

  return ipResult;
}
