import { pageSchema, updatePageRequestSchema } from "@prosektor/contracts";
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
import { assertPageEditableByPanelRole, getPageOriginForTenant } from "@/server/pages/origin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = updatePageRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const page = await getPageOriginForTenant(ctx, id);
    assertPageEditableByPanelRole(page.origin, ctx.role);

    const { data, error } = await ctx.supabase
      .from("pages")
      .update(parsed.data)
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    return jsonOk(pageSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
