import { domainSchema, updateDomainRequestSchema } from "@prosektor/contracts";
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

    const parsed = updateDomainRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data: existing, error: existingError } = await ctx.supabase
      .from("domains")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);
    if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    if (parsed.data.is_primary === undefined) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { _: ["No updatable fields provided"] },
      });
    }

    // Best-effort: ensure only one primary per site.
    if (parsed.data.is_primary) {
      const { error: clearPrimaryError } = await ctx.supabase
        .from("domains")
        .update({ is_primary: false })
        .eq("tenant_id", ctx.tenant.id)
        .eq("site_id", existing.site_id)
        .neq("id", existing.id);
      if (clearPrimaryError) throw mapPostgrestError(clearPrimaryError);
    }

    const { data: updated, error: updateError } = await ctx.supabase
      .from("domains")
      .update({ is_primary: parsed.data.is_primary })
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (updateError) throw mapPostgrestError(updateError);

    // Audit (service role required)
    {
      const nowIso = new Date().toISOString();
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: "domain_update",
        entity_type: "domain",
        entity_id: updated.id,
        changes: { is_primary: { from: existing.is_primary, to: updated.is_primary } },
        meta: { site_id: updated.site_id },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    return jsonOk(domainSchema.parse(updated));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function DELETE(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;

    const { data: existing, error: existingError } = await ctx.supabase
      .from("domains")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);
    if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const { error: deleteError } = await ctx.supabase
      .from("domains")
      .delete()
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id);
    if (deleteError) throw mapPostgrestError(deleteError);

    // Audit (service role required)
    {
      const nowIso = new Date().toISOString();
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: "domain_delete",
        entity_type: "domain",
        entity_id: existing.id,
        changes: null,
        meta: { site_id: existing.site_id },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    return jsonOk(domainSchema.parse(existing));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
