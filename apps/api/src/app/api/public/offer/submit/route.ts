import { publicOfferSubmitSchema, publicSubmitSuccessSchema } from "@prosektor/contracts";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const parsed = publicOfferSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { site_id } = await verifySiteToken(parsed.data.site_token);

    const { data: site, error: siteError } = await admin
      .from("sites")
      .select("id, tenant_id")
      .eq("id", site_id)
      .maybeSingle();
    if (siteError) throw mapPostgrestError(siteError);
    if (!site) throw new HttpError(404, { code: "SITE_NOT_FOUND", message: "Site not found" });

    const { data: moduleInstance, error: moduleError } = await admin
      .from("module_instances")
      .select("enabled")
      .eq("site_id", site.id)
      .eq("module_key", "offer")
      .maybeSingle();
    if (moduleError) throw mapPostgrestError(moduleError);
    if (!moduleInstance || !moduleInstance.enabled) {
      throw new HttpError(404, { code: "MODULE_DISABLED", message: "Module disabled" });
    }

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const rateLimitResult = await enforceRateLimit(
      admin,
      rateLimitKey("public_offer_submit", site.id, ipHash),
      env.publicOfferRlLimit,
      env.publicOfferRlWindowSec
    );

    const nowIso = new Date().toISOString();

    const { data: inserted, error: insertError } = await admin
      .from("offer_requests")
      .insert({
        tenant_id: site.tenant_id,
        site_id: site.id,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company_name: parsed.data.company_name ?? null,
        message: parsed.data.message ?? null,
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
