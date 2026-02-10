import { moduleInstanceSchema, updateModuleInstanceRequestSchema } from "@prosektor/contracts";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = updateModuleInstanceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data: existing, error: existingError } = await ctx.supabase
      .from("module_instances")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);
    if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const mergedSettings =
      parsed.data.settings !== undefined
        ? { ...(existing.settings ?? {}), ...parsed.data.settings }
        : existing.settings ?? {};

    const updateRow: Record<string, unknown> = {
      settings: mergedSettings,
    };
    if (parsed.data.enabled !== undefined) updateRow.enabled = parsed.data.enabled;

    const { data, error } = await ctx.supabase
      .from("module_instances")
      .update(updateRow)
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw mapPostgrestError(error);
    return jsonOk(moduleInstanceSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
