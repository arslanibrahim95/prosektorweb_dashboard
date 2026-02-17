import { HttpError } from "@/server/api/http";
import type { SupabaseClient } from "@supabase/supabase-js";

export const ORIGIN_CACHE_TTL_MS = 60_000;
export const ORIGIN_CACHE_MAX_ENTRIES = 2_048;
export const originDecisionCache = new Map<string, { allowed: boolean; expiresAt: number }>();

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.protocol}//${url.host}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function normalizeDomainCandidate(value: string): string | null {
  let candidate = value.trim().toLowerCase();
  if (candidate.length === 0) return null;

  candidate = candidate.replace(/^https?:\/\//, "");
  candidate = candidate.replace(/\/.*$/, "");
  candidate = candidate.replace(/:\d+$/, "");

  return candidate.length > 0 ? candidate : null;
}

function getAllowedOriginsFromEnv(): Set<string> {
  const raw = process.env.ALLOWED_WEB_ORIGINS ?? "";
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => normalizeOrigin(value))
    .filter((value): value is string => value !== null);

  return new Set(values);
}

function getOriginHostCandidates(normalizedOrigin: string): string[] {
  const url = new URL(normalizedOrigin);
  const host = normalizeDomainCandidate(url.host);
  const hostname = normalizeDomainCandidate(url.hostname);
  const set = new Set<string>();
  if (host) set.add(host);
  if (hostname) set.add(hostname);
  return Array.from(set);
}

function readCachedDecision(normalizedOrigin: string): boolean | null {
  const now = Date.now();
  const cached = originDecisionCache.get(normalizedOrigin);
  if (!cached) return null;
  if (cached.expiresAt <= now) {
    originDecisionCache.delete(normalizedOrigin);
    return null;
  }
  return cached.allowed;
}

export function pruneCache(): void {
  const now = Date.now();

  // 1. Remove expired entries
  for (const [origin, decision] of originDecisionCache.entries()) {
    if (decision.expiresAt <= now) {
      originDecisionCache.delete(origin);
    }
  }

  // 2. If still full, remove negative (denied) decisions
  // Prioritize keeping "allowed" origins to prevent DoS against legitimate users
  if (originDecisionCache.size >= ORIGIN_CACHE_MAX_ENTRIES) {
    for (const [origin, decision] of originDecisionCache.entries()) {
      if (!decision.allowed) {
        originDecisionCache.delete(origin);
        // Stop once we're under the limit to save CPU
        if (originDecisionCache.size < ORIGIN_CACHE_MAX_ENTRIES) break;
      }
    }
  }

  // 3. If still full, remove oldest entries (LRU via Map insertion order)
  while (originDecisionCache.size >= ORIGIN_CACHE_MAX_ENTRIES) {
    const oldest = originDecisionCache.keys().next().value;
    if (!oldest) break;
    originDecisionCache.delete(oldest);
  }
}

function writeCachedDecision(normalizedOrigin: string, allowed: boolean): void {
  pruneCache();
  // SECURITY FIX: Use much shorter TTL for negative (denied) decisions.
  // An attacker could trigger a 'denied' decision for a legitimate origin,
  // blocking real users for the full TTL duration. Short negative TTL limits this DoS vector.
  const ttl = allowed ? ORIGIN_CACHE_TTL_MS : 5_000; // 5s negative vs 60s positive
  originDecisionCache.set(normalizedOrigin, {
    allowed,
    expiresAt: Date.now() + ttl,
  });
}

export function clearOriginDecisionCache(): void {
  originDecisionCache.clear();
}

function isDevLocalhostOrigin(normalizedOrigin: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const hostname = new URL(normalizedOrigin).hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1";
}

async function isAllowedByDynamicSiteData(
  admin: SupabaseClient,
  hostCandidates: string[],
): Promise<boolean> {
  if (typeof (admin as { from?: unknown }).from !== "function") return false;

  for (const host of hostCandidates) {
    const { data: domainMatch, error: domainError } = await admin
      .from("domains")
      .select("id")
      .eq("domain", host)
      .neq("status", "failed")
      .limit(1)
      .maybeSingle();
    if (!domainError && domainMatch) {
      return true;
    }
  }

  for (const host of hostCandidates) {
    const { data: siteMatch, error: siteError } = await admin
      .from("sites")
      .select("id")
      .eq("primary_domain", host)
      .limit(1)
      .maybeSingle();
    if (!siteError && siteMatch) {
      return true;
    }
  }

  return false;
}

async function isAllowedOrigin(
  normalizedOrigin: string,
  admin: SupabaseClient,
): Promise<boolean> {
  const cached = readCachedDecision(normalizedOrigin);
  if (cached !== null) return cached;

  const allowedOrigins = getAllowedOriginsFromEnv();
  if (allowedOrigins.has(normalizedOrigin) || isDevLocalhostOrigin(normalizedOrigin)) {
    writeCachedDecision(normalizedOrigin, true);
    return true;
  }

  const dynamicAllowed = await isAllowedByDynamicSiteData(admin, getOriginHostCandidates(normalizedOrigin));
  writeCachedDecision(normalizedOrigin, dynamicAllowed);
  return dynamicAllowed;
}

/**
 * Validates the Origin header against allowed origins.
 *
 * SECURITY NOTE on null origin:
 * When originHeader is null (non-browser clients: curl, Postman, server-to-server),
 * this function returns null (no CORS headers needed). These requests are still
 * protected by Bearer token authentication via requireAuthContext(). The Origin
 * header is only relevant for browser-based CSRF/CORS protection — non-browser
 * clients cannot be CSRF targets because they don't carry ambient credentials.
 */
export async function assertAllowedWebOrigin(
  originHeader: string | null,
  admin: SupabaseClient,
): Promise<string | null> {
  if (!originHeader) return null;

  const normalizedOrigin = normalizeOrigin(originHeader);
  if (normalizedOrigin && (await isAllowedOrigin(normalizedOrigin, admin))) {
    return normalizedOrigin;
  }

  throw new HttpError(403, {
    code: "FORBIDDEN",
    message: "Forbidden",
  });
}

export async function getAllowedCorsOrigin(
  originHeader: string | null,
  admin: SupabaseClient,
): Promise<string | null> {
  if (!originHeader) return null;
  const normalizedOrigin = normalizeOrigin(originHeader);
  if (!normalizedOrigin) return null;
  return (await isAllowedOrigin(normalizedOrigin, admin)) ? normalizedOrigin : null;
}
