import { getSiteTokenResponseSchema } from "@prosektor/contracts";
import {
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { signSiteToken } from "@/server/site-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;

    const { data: site, error: siteError } = await ctx.supabase
      .from("sites")
      .select("id")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (siteError) throw mapPostgrestError(siteError);
    if (!site) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const { token, expires_at } = await signSiteToken(site.id);

    return jsonOk(getSiteTokenResponseSchema.parse({ site_token: token, expires_at }));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

