export interface ServerEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  siteTokenSecret: string;
  customJwtSecret: string; // Dedicated secret for custom JWT authentication
  storageBucketPrivateCv: string;
  storageBucketPublicMedia: string;
  dashboardReadRateLimit: number;
  dashboardReadRateWindowSec: number;
  dashboardSearchRateLimit: number;
  dashboardSearchRateWindowSec: number;
  dashboardExportRateLimit: number;
  dashboardExportRateWindowSec: number;
  dashboardSummaryCacheTtlSec: number;
  // Public endpoint rate limits
  publicContactRlLimit: number;
  publicContactRlWindowSec: number;
  publicOfferRlLimit: number;
  publicOfferRlWindowSec: number;
  publicHrApplyRlLimit: number;
  publicHrApplyRlWindowSec: number;
  /** Dedicated salt for IP hashing in rate limiting (falls back to siteTokenSecret if not set) */
  rateLimitSalt: string;
}

let cachedEnv: ServerEnv | null = null;

function pickEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function requireEnv(name: string): string {
  const value = pickEnv(name);
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function pickPositiveInt(name: string, fallback: number): number {
  const raw = pickEnv(name);
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return parsed;
}

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const supabaseUrl = pickEnv("SUPABASE_URL") ?? pickEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseUrl) {
    throw new Error("Missing required env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  }

  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  // SECURITY FIX: Removed dangerous fallback to service role key
  // The anon key must always be explicitly configured
  const supabaseAnonKey =
    pickEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    pickEnv("SUPABASE_ANON_KEY");
  if (!supabaseAnonKey) {
    throw new Error(
      "Missing required env: NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY). " +
      "The anon key must be explicitly configured and should never use the service role key."
    );
  }

  // SECURITY: Validate that JWT secret is different from site token secret
  const siteTokenSecret = requireEnv("SITE_TOKEN_SECRET");
  const customJwtSecret = requireEnv("CUSTOM_JWT_SECRET");

  if (siteTokenSecret === customJwtSecret) {
    throw new Error(
      "SECURITY ERROR: CUSTOM_JWT_SECRET must be different from SITE_TOKEN_SECRET. " +
      "Using the same secret for different purposes creates a security vulnerability."
    );
  }

  // SECURITY: Object.freeze prevents downstream mutation of shared config
  cachedEnv = Object.freeze({
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    siteTokenSecret,
    customJwtSecret,
    storageBucketPrivateCv: pickEnv("STORAGE_BUCKET_PRIVATE_CV") ?? "private-cv",
    storageBucketPublicMedia: pickEnv("STORAGE_BUCKET_PUBLIC_MEDIA") ?? "public-media",
    dashboardReadRateLimit: pickPositiveInt("DASHBOARD_READ_RL_LIMIT", 120),
    dashboardReadRateWindowSec: pickPositiveInt("DASHBOARD_READ_RL_WINDOW_SEC", 60),
    dashboardSearchRateLimit: pickPositiveInt("DASHBOARD_SEARCH_RL_LIMIT", 30),
    dashboardSearchRateWindowSec: pickPositiveInt("DASHBOARD_SEARCH_RL_WINDOW_SEC", 60),
    dashboardExportRateLimit: pickPositiveInt("DASHBOARD_EXPORT_RL_LIMIT", 3),
    dashboardExportRateWindowSec: pickPositiveInt("DASHBOARD_EXPORT_RL_WINDOW_SEC", 600),
    dashboardSummaryCacheTtlSec: pickPositiveInt("DASHBOARD_SUMMARY_CACHE_TTL_SEC", 20),
    // Public endpoint rate limits
    publicContactRlLimit: pickPositiveInt("PUBLIC_CONTACT_RL_LIMIT", 5),
    publicContactRlWindowSec: pickPositiveInt("PUBLIC_CONTACT_RL_WINDOW_SEC", 60),
    publicOfferRlLimit: pickPositiveInt("PUBLIC_OFFER_RL_LIMIT", 5),
    publicOfferRlWindowSec: pickPositiveInt("PUBLIC_OFFER_RL_WINDOW_SEC", 60),
    publicHrApplyRlLimit: pickPositiveInt("PUBLIC_HR_APPLY_RL_LIMIT", 3),
    publicHrApplyRlWindowSec: pickPositiveInt("PUBLIC_HR_APPLY_RL_WINDOW_SEC", 300),
    // SECURITY: Dedicated salt for IP hashing to avoid dual-use of siteTokenSecret
    rateLimitSalt: pickEnv("RATE_LIMIT_SALT") ?? siteTokenSecret + ":ratelimit",
  });

  return cachedEnv;
}
