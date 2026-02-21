import { createSiteRequestSchema, listSitesResponseSchema, siteSchema } from "@prosektor/contracts";
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
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";
import { clearOriginDecisionCache } from "@/server/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);

    const { data, error, count } = await ctx.supabase
      .from("sites")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: true });
    if (error) throw mapPostgrestError(error);

    return jsonOk(
      listSitesResponseSchema.parse({
        items: (data ?? []).map((s) => siteSchema.parse(s)),
        total: count ?? 0,
      }),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    const body = await parseJson(req);

    const parsed = createSiteRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data, error } = await ctx.supabase
      .from("sites")
      .insert({
        tenant_id: ctx.tenant.id,
        name: parsed.data.name,
        primary_domain: parsed.data.primary_domain ?? null,
        settings: parsed.data.settings ?? {},
      })
      .select("*")
      .single();
    if (error) throw mapPostgrestError(error);

    clearOriginDecisionCache();
    return jsonOk(siteSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
