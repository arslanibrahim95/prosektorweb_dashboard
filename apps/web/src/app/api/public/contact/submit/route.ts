import { publicContactSubmitSchema, publicSubmitSuccessSchema } from "@prosektor/contracts";
import { NextResponse } from "next/server";
import {
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
import { enforceRateLimit, getClientIp, hashIp, rateLimitKey } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const admin = createAdminClient();

    const raw = await parseJson(req);
    if (
      raw &&
      typeof raw === "object" &&
      typeof (raw as Record<string, unknown>).honeypot === "string" &&
      ((raw as Record<string, unknown>).honeypot as string).length > 0
    ) {
      return new NextResponse(null, { status: 204 });
    }

    const parsed = publicContactSubmitSchema.safeParse(raw);
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
      .eq("module_key", "contact")
      .maybeSingle();
    if (moduleError) throw mapPostgrestError(moduleError);
    if (!moduleInstance || !moduleInstance.enabled) {
      throw new HttpError(404, { code: "MODULE_DISABLED", message: "Module disabled" });
    }

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    await enforceRateLimit(admin, rateLimitKey("public_contact_submit", site.id, ipHash), 5, 3600);

    const nowIso = new Date().toISOString();

    const { data: inserted, error: insertError } = await admin
      .from("contact_messages")
      .insert({
        tenant_id: site.tenant_id,
        site_id: site.id,
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        subject: parsed.data.subject ?? null,
        message: parsed.data.message,
        kvkk_accepted_at: nowIso,
        source: {},
        is_read: false,
      })
      .select("id")
      .single();
    if (insertError) throw mapPostgrestError(insertError);

    return jsonOk(publicSubmitSuccessSchema.parse({ id: inserted.id }));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

