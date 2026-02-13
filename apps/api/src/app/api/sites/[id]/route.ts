import { siteSchema, updateSiteRequestSchema } from "@prosektor/contracts";
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
import { requireAuthContext } from "@/server/auth/context";
import { clearOriginDecisionCache } from "@/server/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;

    const { data, error } = await ctx.supabase
      .from("sites")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    clearOriginDecisionCache();
    return jsonOk(siteSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = updateSiteRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data, error } = await ctx.supabase
      .from("sites")
      .update(parsed.data)
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    return jsonOk(siteSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
