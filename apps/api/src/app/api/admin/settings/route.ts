import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    parseJson,
} from "@/server/api/http";
import { type UserRole } from "@prosektor/contracts";
import { requireAuthContext } from "@/server/auth/context";
import { isAdminRole, isOwnerRole } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertAdminRole(role: UserRole) {
    if (!isAdminRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
    }
}

function assertOwnerRole(role: UserRole) {
    if (!isOwnerRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message: "Sadece workspace sahibi ayarları değiştirebilir" });
    }
}

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_settings", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

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
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

export async function PATCH(req: Request) {
    try {
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
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
