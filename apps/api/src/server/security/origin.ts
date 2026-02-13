import { HttpError } from "@/server/api/http";
import type { SupabaseClient } from "@supabase/supabase-js";

const ORIGIN_CACHE_TTL_MS = 60_000;
const ORIGIN_CACHE_MAX_ENTRIES = 2_048;
const originDecisionCache = new Map<string, { allowed: boolean; expiresAt: number }>();

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

function pruneCache(): void {
  const now = Date.now();

  for (const [origin, decision] of originDecisionCache.entries()) {
    if (decision.expiresAt <= now) {
      originDecisionCache.delete(origin);
    }
  }

  while (originDecisionCache.size >= ORIGIN_CACHE_MAX_ENTRIES) {
    const oldest = originDecisionCache.keys().next().value;
    if (!oldest) break;
    originDecisionCache.delete(oldest);
  }
}

function writeCachedDecision(normalizedOrigin: string, allowed: boolean): void {
  pruneCache();
  originDecisionCache.set(normalizedOrigin, {
    allowed,
    expiresAt: Date.now() + ORIGIN_CACHE_TTL_MS,
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
