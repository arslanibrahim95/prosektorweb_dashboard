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
        throw new HttpError(403, { code: "FORBIDDEN", message: "Sadece workspace sahibi bildirim ayarlarını değiştirebilir" });
    }
}

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_notifications", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        // Get tenant settings for notification configuration
        const { data: tenant, error: tenantError } = await ctx.admin
            .from("tenants")
            .select("*")
            .eq("id", ctx.tenant.id)
            .single();

        if (tenantError) throw mapPostgrestError(tenantError);

        // Get site settings for notification configuration
        const { data: sites, error: sitesError } = await ctx.admin
            .from("sites")
            .select("*")
            .eq("tenant_id", ctx.tenant.id);

        if (sitesError) throw mapPostgrestError(sitesError);

        // Extract notification settings from tenant/site metadata
        const tenantMeta = (tenant.meta ?? {}) as Record<string, unknown>;
        const notificationSettings = (tenantMeta.notifications ?? {}) as Record<string, unknown>;

        return jsonOk(
            {
                enabled: notificationSettings.enabled ?? true,
                email_notifications: notificationSettings.email_notifications ?? true,
                slack_notifications: notificationSettings.slack_notifications ?? false,
                webhook_url: notificationSettings.webhook_url ?? null,
                notification_types: notificationSettings.notification_types ?? {
                    new_user: true,
                    role_change: true,
                    content_published: true,
                    system_alert: true,
                },
                sites: (sites ?? []).map((site) => ({
                    id: site.id,
                    name: site.name,
                    notifications_enabled: ((site.settings ?? {}) as Record<string, unknown>).notifications_enabled ?? true,
                })),
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

        const {
            enabled,
            email_notifications,
            slack_notifications,
            webhook_url,
            notification_types,
        } = body as {
            enabled?: boolean;
            email_notifications?: boolean;
            slack_notifications?: boolean;
            webhook_url?: string | null;
            notification_types?: Record<string, boolean>;
        };

        // Get current tenant
        const { data: tenant, error: tenantError } = await ctx.admin
            .from("tenants")
            .select("*")
            .eq("id", ctx.tenant.id)
            .single();

        if (tenantError) throw mapPostgrestError(tenantError);

        const tenantMeta = (tenant.meta ?? {}) as Record<string, unknown>;
        const currentNotifications = (tenantMeta.notifications ?? {}) as Record<string, unknown>;

        // Update notification settings
        const updatedNotifications = {
            ...currentNotifications,
            ...(enabled !== undefined && { enabled }),
            ...(email_notifications !== undefined && { email_notifications }),
            ...(slack_notifications !== undefined && { slack_notifications }),
            ...(webhook_url !== undefined && { webhook_url }),
            ...(notification_types !== undefined && { notification_types }),
        };

        const updatedMeta = {
            ...tenantMeta,
            notifications: updatedNotifications,
        };

        const { data: updatedTenant, error: updateError } = await ctx.admin
            .from("tenants")
            .update({ meta: updatedMeta })
            .eq("id", ctx.tenant.id)
            .select("*")
            .single();

        if (updateError) throw mapPostgrestError(updateError);

        // Audit log
        {
            const nowIso = new Date().toISOString();
            const { error: auditError } = await ctx.admin.from("audit_logs").insert({
                tenant_id: ctx.tenant.id,
                actor_id: ctx.user.id,
                action: "notification_settings_update",
                entity_type: "tenant",
                entity_id: ctx.tenant.id,
                changes: { notifications: { from: currentNotifications, to: updatedNotifications } },
                meta: null,
                created_at: nowIso,
            });
            if (auditError) throw mapPostgrestError(auditError);
        }

        const updatedTenantMeta = (updatedTenant.meta ?? {}) as Record<string, unknown>;
        const finalNotifications = (updatedTenantMeta.notifications ?? {}) as Record<string, unknown>;

        return jsonOk({
            enabled: finalNotifications.enabled ?? true,
            email_notifications: finalNotifications.email_notifications ?? true,
            slack_notifications: finalNotifications.slack_notifications ?? false,
            webhook_url: finalNotifications.webhook_url ?? null,
            notification_types: finalNotifications.notification_types ?? {},
        });
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
