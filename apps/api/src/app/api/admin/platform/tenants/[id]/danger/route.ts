import {
  platformTenantDangerRequestSchema,
  platformTenantSummarySchema,
  uuidSchema,
  type UserRole,
} from "@prosektor/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  asErrorBody,
  asStatus,
  asHeaders,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { isSuperAdminRole } from "@/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertSuperAdmin(role: UserRole) {
  if (!isSuperAdminRole(role)) {
    throw new HttpError(403, {
      code: "FORBIDDEN",
      message: "Bu işlem yalnızca super_admin için yetkilidir.",
    });
  }
}

function statusForAction(action: "suspend" | "reactivate" | "soft_delete"): "active" | "suspended" | "deleted" {
  if (action === "suspend") return "suspended";
  if (action === "reactivate") return "active";
  return "deleted";
}

async function loadTenantCounts(admin: SupabaseClient, tenantId: string) {
  const [ownersRes, sitesRes] = await Promise.all([
    admin
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "owner"),
    admin
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);

  if (ownersRes.error) throw mapPostgrestError(ownersRes.error);
  if (sitesRes.error) throw mapPostgrestError(sitesRes.error);

  return {
    ownersCount: ownersRes.count ?? 0,
    sitesCount: sitesRes.count ?? 0,
  };
}

export async function POST(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    assertSuperAdmin(ctx.role);

    const { id } = await ctxRoute.params;
    const parsedId = uuidSchema.safeParse(id);
    if (!parsedId.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Geçersiz tenant id.",
      });
    }

    const body = await parseJson(req);
    const parsedBody = platformTenantDangerRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsedBody.error),
      });
    }

    const { data: tenant, error: tenantError } = await ctx.admin
      .from("tenants")
      .select("id, name, slug, plan, status, created_at, updated_at")
      .eq("id", parsedId.data)
      .single();
    if (tenantError) throw mapPostgrestError(tenantError);

    const confirmationExpected = tenant.slug;
    if (parsedBody.data.confirmation_text.trim() !== confirmationExpected) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Onay metni tenant slug ile eşleşmelidir.",
        details: {
          confirmation_text: [`Beklenen metin: ${confirmationExpected}`],
        },
      });
    }

    const nextStatus = statusForAction(parsedBody.data.action);

    const { data: updatedTenant, error: updateError } = await ctx.admin
      .from("tenants")
      .update({ status: nextStatus })
      .eq("id", tenant.id)
      .select("id, name, slug, plan, status, created_at, updated_at")
      .single();
    if (updateError) throw mapPostgrestError(updateError);

    const { data: auditRow, error: auditError } = await ctx.admin
      .from("platform_audit_logs")
      .insert({
        actor_id: ctx.user.id,
        action: `tenant_${parsedBody.data.action}`,
        entity_type: "tenant",
        entity_id: tenant.id,
        reason: parsedBody.data.reason,
        details: {
          previous_status: tenant.status,
          new_status: nextStatus,
          confirmation_text: parsedBody.data.confirmation_text,
        },
      })
      .select("id")
      .single();
    if (auditError) throw mapPostgrestError(auditError);

    const counts = await loadTenantCounts(ctx.admin, tenant.id);

    console.info("[platform-danger-action]", {
      actorId: ctx.user.id,
      tenantId: tenant.id,
      action: parsedBody.data.action,
      auditId: auditRow.id,
    });

    return jsonOk({
      tenant: platformTenantSummarySchema.parse({
        ...updatedTenant,
        owners_count: counts.ownersCount,
        sites_count: counts.sitesCount,
      }),
      audit_id: auditRow.id,
    });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
