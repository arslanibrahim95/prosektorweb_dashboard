import { publicAppointmentSubmitSchema, publicSubmitSuccessSchema } from "@prosektor/contracts";
import { NextResponse } from "next/server";
import {
  asHeaders,
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { createAdminClient } from "@/server/supabase";
import { verifySiteToken } from "@/server/site-token";
import { enforceRateLimit, getClientIp, hashIp, rateLimitKey, rateLimitHeaders } from "@/server/rate-limit";
import { getServerEnv } from "@/server/env";
import { getOrSetCachedValue } from "@/server/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PUBLIC_PRECHECK_CACHE_TTL_SEC = 60;

type PublicSiteLookup = {
  id: string;
  tenant_id: string;
};

function getPublicSiteCacheKey(siteId: string): string {
  return ["public-site", siteId].join("|");
}

function getPublicModuleCacheKey(siteId: string, moduleKey: string): string {
  return ["public-module-enabled", siteId, moduleKey].join("|");
}

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();
    const env = getServerEnv();

    const raw = await parseJson(req);
    // Honeypot: silently drop to avoid giving bots a signal.
    if (
      raw &&
      typeof raw === "object" &&
      typeof (raw as Record<string, unknown>).honeypot === "string" &&
      ((raw as Record<string, unknown>).honeypot as string).length > 0
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const parsed = publicAppointmentSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { site_id } = await verifySiteToken(parsed.data.site_token);

    const site = await getOrSetCachedValue<PublicSiteLookup | null>(
      getPublicSiteCacheKey(site_id),
      PUBLIC_PRECHECK_CACHE_TTL_SEC,
      async () => {
        const { data, error } = await admin
          .from("sites")
          .select("id, tenant_id")
          .eq("id", site_id)
          .maybeSingle();
        if (error) throw mapPostgrestError(error);
        return data;
      }
    );

    if (!site) throw new HttpError(404, { code: "SITE_NOT_FOUND", message: "Site not found" });

    const moduleEnabled = await getOrSetCachedValue<boolean>(
      getPublicModuleCacheKey(site.id, "appointment"),
      PUBLIC_PRECHECK_CACHE_TTL_SEC,
      async () => {
        const { data, error } = await admin
          .from("module_instances")
          .select("enabled")
          .eq("site_id", site.id)
          .eq("module_key", "appointment")
          .maybeSingle();
        if (error) throw mapPostgrestError(error);
        return Boolean(data?.enabled);
      }
    );

    if (!moduleEnabled) {
      throw new HttpError(404, { code: "MODULE_DISABLED", message: "Module disabled" });
    }

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const rateLimitResult = await enforceRateLimit(
      admin,
      rateLimitKey("public_appointment_submit", site.id, ipHash),
      env.publicOfferRlLimit,
      env.publicOfferRlWindowSec
    );

    const nowIso = new Date().toISOString();

    const { data: inserted, error: insertError } = await admin
      .from("appointment_requests")
      .insert({
        tenant_id: site.tenant_id,
        site_id: site.id,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company_name: parsed.data.company_name ?? null,
        message: parsed.data.message ?? null,
        preferred_date: parsed.data.preferred_date ?? null,
        preferred_time: parsed.data.preferred_time ?? null,
        kvkk_accepted_at: nowIso,
        source: {},
        is_read: false,
      })
      .select("id")
      .single();
    if (insertError) throw mapPostgrestError(insertError);

    return jsonOk(
      publicSubmitSuccessSchema.parse({ id: inserted.id }),
      200,
      rateLimitHeaders(rateLimitResult)
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
