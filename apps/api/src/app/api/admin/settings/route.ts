import {
    HttpError,
    jsonOk,
    mapPostgrestError,
    parseJson,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole, assertOwnerRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_settings", "read");

        // Get tenant settings
        const { data: tenant, error: tenantError } = await ctx.admin
            .from("tenants")
            .select("*")
            .eq("id", ctx.tenant.id)
            .single();

        if (tenantError) throw mapPostgrestError(tenantError);

        // Get site settings
        const { data: sites, error: sitesError } = await ctx.admin
            .from("sites")
            .select("*")
            .eq("tenant_id", ctx.tenant.id);

        if (sitesError) throw mapPostgrestError(sitesError);

        return jsonOk(
            {
                tenant,
                sites: sites ?? [],
            },
            200,
            rateLimitHeaders(rateLimit),
        );
});

export const PATCH = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);
        const body = await parseJson(req);

        assertOwnerRole(ctx.role);

        if (!body || typeof body !== "object") {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Invalid request body",
            });
        }

        const { tenant, site } = body as {
            tenant?: { name?: string; plan?: string };
            site?: { id: string; settings?: Record<string, unknown> };
        };

        const nowIso = new Date().toISOString();
        const results: { tenant?: unknown; site?: unknown } = {};

        // Update tenant if provided
        if (tenant) {
            const updateData: Record<string, unknown> = {};
            if (tenant.name) updateData.name = tenant.name;
            if (tenant.plan) updateData.plan = tenant.plan;

            if (Object.keys(updateData).length > 0) {
                const { data: updatedTenant, error: tenantError } = await ctx.admin
                    .from("tenants")
                    .update(updateData)
                    .eq("id", ctx.tenant.id)
                    .select("*")
                    .single();

                if (tenantError) throw mapPostgrestError(tenantError);
                results.tenant = updatedTenant;

                // Audit log
                {
                    const { error: auditError } = await ctx.admin.from("audit_logs").insert({
                        tenant_id: ctx.tenant.id,
                        actor_id: ctx.user.id,
                        action: "settings_update",
                        entity_type: "tenant",
                        entity_id: ctx.tenant.id,
                        changes: { settings: { from: null, to: updateData } },
                        meta: null,
                        created_at: nowIso,
                    });
                    if (auditError) throw mapPostgrestError(auditError);
                }
            }
        }

        // Update site if provided
        if (site && site.id) {
            const updateData: Record<string, unknown> = {};
            if (site.settings) updateData.settings = site.settings;

            if (Object.keys(updateData).length > 0) {
                const { data: updatedSite, error: siteError } = await ctx.admin
                    .from("sites")
                    .update(updateData)
                    .eq("id", site.id)
                    .eq("tenant_id", ctx.tenant.id)
                    .select("*")
                    .single();

                if (siteError) throw mapPostgrestError(siteError);
                results.site = updatedSite;

                // Audit log
                {
                    const { error: auditError } = await ctx.admin.from("audit_logs").insert({
                        tenant_id: ctx.tenant.id,
                        actor_id: ctx.user.id,
                        action: "settings_update",
                        entity_type: "site",
                        entity_id: site.id,
                        changes: { settings: { from: null, to: updateData } },
                        meta: null,
                        created_at: nowIso,
                    });
                    if (auditError) throw mapPostgrestError(auditError);
                }
            }
        }

        return jsonOk(results);
});
