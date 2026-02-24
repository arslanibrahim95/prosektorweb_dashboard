import { legalTextSchema, updateLegalTextRequestSchema } from "@prosektor/contracts";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = updateLegalTextRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const updateRow: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

    const { data, error } = await ctx.supabase
      .from("legal_texts")
      .update(updateRow)
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    return jsonOk(legalTextSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

export async function DELETE(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    const { id } = await ctxRoute.params;

    const { data: existing, error: existingError } = await ctx.supabase
      .from("legal_texts")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);
    if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const { error: deleteError } = await ctx.supabase
      .from("legal_texts")
      .delete()
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id);
    if (deleteError) throw mapPostgrestError(deleteError);

    return jsonOk(legalTextSchema.parse(existing));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

