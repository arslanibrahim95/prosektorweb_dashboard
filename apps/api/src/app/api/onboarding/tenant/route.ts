import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import {
  asErrorBody,
  asHeaders,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { createAdminClient, getBearerToken } from "@/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLUG_LENGTH = 60;
const MAX_TENANTS_PER_USER = 5;
const TENANT_CREATE_RATE_LIMIT = 3;
const TENANT_CREATE_RATE_WINDOW_SECONDS = 3600;

const createOnboardingTenantSchema = z
  .object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(120).optional(),
  })
  .strict();

const TURKISH_CHAR_MAP: Record<string, string> = {
  İ: "i",
  I: "i",
  ı: "i",
  Ğ: "g",
  ğ: "g",
  Ü: "u",
  ü: "u",
  Ö: "o",
  ö: "o",
  Ş: "s",
  ş: "s",
  Ç: "c",
  ç: "c",
};

function normalizeOrganizationName(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(raw: string): string {
  const mapped = raw
    .normalize("NFKC")
    .split("")
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join("");

  return mapped
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

function isTenantSlugConflict(error: PostgrestError): boolean {
  if (error.code !== "23505") return false;

  const conflictText = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return conflictText.includes("tenants_slug_key") || conflictText.includes("(slug)");
}

async function parseRequestBody(req: Request): Promise<{ name: string; slug?: string }> {
  const body = await parseJson(req);
  const parsed = createOnboardingTenantSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: zodErrorToDetails(parsed.error),
    });
  }

  return parsed.data;
}

const onboardingTenantResultSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  plan: z.enum(["demo", "starter", "pro"]),
});

function mapOnboardingRpcError(error: PostgrestError): HttpError {
  if (isTenantSlugConflict(error)) {
    return new HttpError(409, {
      code: "CONFLICT",
      message: "Could not generate unique organization URL. Please try again.",
    });
  }

  const errorText = `${error.message} ${error.details ?? ""}`.toLowerCase();
  if (error.code === "42501" && errorText.includes("owned tenant limit exceeded")) {
    return new HttpError(403, {
      code: "FORBIDDEN",
      message: `You can only create up to ${MAX_TENANTS_PER_USER} organizations`,
    });
  }

  return mapPostgrestError(error);
}

// POST /api/onboarding/tenant - Create a new tenant for the user
export async function POST(req: Request) {
  const supabase = createAdminClient();
  let userId: string | null = null;

  try {
    // 1. Authenticate user
    const token = getBearerToken(req);
    if (!token) {
      throw new HttpError(401, {
        code: "UNAUTHORIZED",
        message: "No valid authorization header",
      });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new HttpError(401, {
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
    userId = user.id;

    // 2. Rate limit tenant creation attempts
    const rateLimit = await enforceRateLimit(
      supabase,
      rateLimitAuthKey("onboarding-tenant", "global", user.id),
      TENANT_CREATE_RATE_LIMIT,
      TENANT_CREATE_RATE_WINDOW_SECONDS,
    );

    // 3. Parse and validate request body
    const payload = await parseRequestBody(req);
    const normalizedName = normalizeOrganizationName(payload.name);

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: {
          name: ["Organization name must be between 2 and 100 characters"],
        },
      });
    }

    const preferredSlug = payload.slug ? slugify(payload.slug) : undefined;
    if (payload.slug && !preferredSlug) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: {
          slug: ["Organization URL must include at least one letter or number"],
        },
      });
    }

    // 4. Atomically create tenant/member/site in DB function
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_onboarding_tenant", {
      _user_id: user.id,
      _name: normalizedName,
      _preferred_slug: preferredSlug ?? null,
      _max_owned_tenants: MAX_TENANTS_PER_USER,
    });
    if (rpcError) {
      throw mapOnboardingRpcError(rpcError);
    }

    const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const parsedTenant = onboardingTenantResultSchema.safeParse(rpcRow);
    if (!parsedTenant.success) {
      throw new HttpError(500, {
        code: "INTERNAL_ERROR",
        message: "Invalid onboarding response",
      });
    }

    return jsonOk(
      {
        id: parsedTenant.data.id,
        name: parsedTenant.data.name,
        slug: parsedTenant.data.slug,
        plan: parsedTenant.data.plan,
      },
      201,
      rateLimitHeaders(rateLimit),
    );
  } catch (error) {
    const status = asStatus(error);
    if (status >= 500) {
      console.error("[onboarding/tenant] request failed", {
        userId,
        status,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    return jsonError(asErrorBody(error), status, asHeaders(error));
  }
}
