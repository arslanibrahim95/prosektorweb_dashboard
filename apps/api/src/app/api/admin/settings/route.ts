import {
    HttpError,
    jsonOk,
    mapPostgrestError,
    parseJson,
    zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole, assertOwnerRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsPatchSchema = z.object({
    tenant: z.object({
        name: z.string().min(1).max(100).optional(),
        plan: z.string().min(1).max(50).optional(),
    }).optional(),
    site: z.object({
        id: z.string().uuid(),
        settings: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
    security: z.record(z.string(), z.unknown()).optional(),
}).strict();

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
    const rawBody = await parseJson(req);

    assertAdminRole(ctx.role, "Yönetici yetkisi gerekli");

    // Validate request body with Zod schema
    const parsed = settingsPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
        throw new HttpError(400, {
            code: "VALIDATION_ERROR",
            message: "Geçersiz istek gövdesi",
            details: zodErrorToDetails(parsed.error),
        });
    }

    const { tenant, site, security } = parsed.data;

    // Plan updates require owner role (privilege escalation prevention)
    if (tenant?.plan) {
        assertOwnerRole(ctx.role, "Plan değişikliği sadece workspace sahibi tarafından yapılabilir");
    }

    const nowIso = new Date().toISOString();
    const results: { tenant?: unknown; site?: unknown; settings?: unknown } = {};

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

    // Update security settings (stored in tenant.settings.security)
    if (security) {
        const { data: currentTenant } = await ctx.admin
            .from("tenants")
            .select("settings")
            .eq("id", ctx.tenant.id)
            .single();

        const currentSettings = (currentTenant?.settings ?? {}) as Record<string, unknown>;
        const mergedSettings = { ...currentSettings, security };

        const { data: updatedTenant, error: securityError } = await ctx.admin
            .from("tenants")
            .update({ settings: mergedSettings })
            .eq("id", ctx.tenant.id)
            .select("*")
            .single();

        if (securityError) throw mapPostgrestError(securityError);
        results.settings = updatedTenant;

        // Audit log
        {
            const { error: auditError } = await ctx.admin.from("audit_logs").insert({
                tenant_id: ctx.tenant.id,
                actor_id: ctx.user.id,
                action: "security_settings_update",
                entity_type: "tenant",
                entity_id: ctx.tenant.id,
                changes: { security: { from: currentSettings.security ?? null, to: security } },
                meta: null,
                created_at: nowIso,
            });
            if (auditError) throw mapPostgrestError(auditError);
        }
    }

    return jsonOk(results);
});

