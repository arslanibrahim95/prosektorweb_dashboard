import {
  platformTenantSummarySchema,
  platformUpdateTenantRequestSchema,
  uuidSchema,
} from "@prosektor/contracts";
import {
  HttpError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";
import { assertSuperAdminRole } from "@/server/admin/access";
import { loadPlatformTenantCounts } from "@/server/admin/platform-tenants";
import { withAdminErrorHandling } from "@/server/admin/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const GET = withAdminErrorHandling(async (
  req: Request,
  ctxRoute: { params: Promise<{ id: string }> },
) => {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    assertSuperAdminRole(ctx.role);

    const { id } = await ctxRoute.params;
    const parsedId = uuidSchema.safeParse(id);
    if (!parsedId.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Geçersiz tenant id.",
      });
    }

    const { data: tenant, error } = await ctx.admin
      .from("tenants")
      .select("id, name, slug, plan, status, created_at, updated_at")
      .eq("id", parsedId.data)
      .single();
    if (error) throw mapPostgrestError(error);

    const counts = await loadPlatformTenantCounts(ctx.admin, tenant.id);

    return jsonOk(
      platformTenantSummarySchema.parse({
        ...tenant,
        owners_count: counts.ownersCount,
        sites_count: counts.sitesCount,
      }),
    );
});

export const PATCH = withAdminErrorHandling(async (
  req: Request,
  ctxRoute: { params: Promise<{ id: string }> },
) => {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    assertSuperAdminRole(ctx.role);

    const { id } = await ctxRoute.params;
    const parsedId = uuidSchema.safeParse(id);
    if (!parsedId.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Geçersiz tenant id.",
      });
    }

    const body = await parseJson(req);
    const parsedBody = platformUpdateTenantRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsedBody.error),
      });
    }

    const { data: existingTenant, error: existingError } = await ctx.admin
      .from("tenants")
      .select("id, name, slug, plan, status, settings, created_at, updated_at")
      .eq("id", parsedId.data)
      .single();
    if (existingError) throw mapPostgrestError(existingError);

    const payload = parsedBody.data;
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.slug !== undefined) updateData.slug = payload.slug;
    if (payload.plan !== undefined) updateData.plan = payload.plan;
    if (payload.status !== undefined) updateData.status = payload.status;

    if (payload.settings !== undefined) {
      updateData.settings = payload.settings;
    }

    if (payload.meta !== undefined) {
      const baseSettings = isPlainObject(updateData.settings)
        ? updateData.settings
        : isPlainObject(existingTenant.settings)
          ? existingTenant.settings
          : {};
      updateData.settings = {
        ...baseSettings,
        meta: payload.meta,
      };
    }

    let updatedTenant = existingTenant;
    if (Object.keys(updateData).length > 0) {
      const { data, error } = await ctx.admin
        .from("tenants")
        .update(updateData)
        .eq("id", existingTenant.id)
        .select("id, name, slug, plan, status, created_at, updated_at")
        .single();
      if (error) throw mapPostgrestError(error);
      updatedTenant = {
        ...existingTenant,
        ...data,
      };

      const changedKeys = Object.keys(updateData);
      const { error: auditError } = await ctx.admin.from("platform_audit_logs").insert({
        actor_id: ctx.user.id,
        action: "tenant_update",
        entity_type: "tenant",
        entity_id: existingTenant.id,
        reason: "Platform tenant update",
        details: {
          changed_keys: changedKeys,
        },
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    const counts = await loadPlatformTenantCounts(ctx.admin, existingTenant.id);

    return jsonOk(
      platformTenantSummarySchema.parse({
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        plan: updatedTenant.plan,
        status: updatedTenant.status,
        created_at: updatedTenant.created_at,
        updated_at: updatedTenant.updated_at,
        owners_count: counts.ownersCount,
        sites_count: counts.sitesCount,
      }),
    );
});
