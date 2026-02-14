import { tenantMemberSchema, updateTenantMemberRequestSchema } from "@prosektor/contracts";
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

    const parsed = updateTenantMemberRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data: existing, error: existingError } = await ctx.supabase
      .from("tenant_members")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);
    if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const { data: updated, error: updateError } = await ctx.supabase
      .from("tenant_members")
      .update({ role: parsed.data.role })
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (updateError) throw mapPostgrestError(updateError);

    // Audit (service role required). Avoid PII in audit logs.
    {
      const nowIso = new Date().toISOString();
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: "role_change",
        entity_type: "tenant_member",
        entity_id: updated.id,
        changes: { role: { from: existing.role, to: updated.role } },
        meta: { user_id: updated.user_id },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    return jsonOk(tenantMemberSchema.parse(updated));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function DELETE(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;

    const { data: existing, error: existingError } = await ctx.supabase
      .from("tenant_members")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);
    if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const { error: deleteError } = await ctx.supabase
      .from("tenant_members")
      .delete()
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id);
    if (deleteError) throw mapPostgrestError(deleteError);

    // Audit (service role required). Avoid PII in audit logs.
    {
      const nowIso = new Date().toISOString();
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: "member_remove",
        entity_type: "tenant_member",
        entity_id: existing.id,
        changes: null,
        meta: { user_id: existing.user_id },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    return jsonOk(tenantMemberSchema.parse(existing));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

