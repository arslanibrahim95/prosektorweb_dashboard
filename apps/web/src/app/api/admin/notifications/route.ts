import {
    HttpError,
    jsonOk,
    mapPostgrestError,
    parseJson,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotificationTemplateType = "email" | "sms" | "push" | "in_app";
type EmailHistoryStatus = "sent" | "failed" | "pending";

interface NotificationTemplatePayload {
    id: string;
    name: string;
    type: NotificationTemplateType;
    trigger_event: string;
    trigger_label: string;
    subject?: string;
    body: string;
    is_active: boolean;
    updated_at: string;
}

interface EmailHistoryItemPayload {
    id: string;
    recipient: string;
    subject: string;
    status: EmailHistoryStatus;
    sent_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeTemplateType(value: unknown): NotificationTemplateType {
    if (value === "sms" || value === "push" || value === "in_app") {
        return value;
    }
    return "email";
}

function normalizeEmailStatus(value: unknown): EmailHistoryStatus {
    if (value === "failed" || value === "pending") {
        return value;
    }
    return "sent";
}

function normalizeNotificationTypes(value: unknown): Record<string, boolean> {
    if (!isRecord(value)) return {};

    const normalized: Record<string, boolean> = {};
    for (const [key, raw] of Object.entries(value)) {
        if (typeof raw === "boolean") {
            normalized[key] = raw;
        }
    }
    return normalized;
}

function normalizeNotificationTemplates(value: unknown): NotificationTemplatePayload[] {
    if (!Array.isArray(value)) return [];

    const nowIso = new Date().toISOString();
    const normalized = value
        .map((item, index): NotificationTemplatePayload | null => {
            if (!isRecord(item)) return null;

            const id = typeof item.id === "string" && item.id.trim()
                ? item.id
                : `template-${index + 1}`;
            const name = typeof item.name === "string" && item.name.trim()
                ? item.name
                : "İsimsiz Şablon";
            const triggerEvent = typeof item.trigger_event === "string" && item.trigger_event.trim()
                ? item.trigger_event
                : "custom";
            const triggerLabel = typeof item.trigger_label === "string" && item.trigger_label.trim()
                ? item.trigger_label
                : triggerEvent;
            const body = typeof item.body === "string" ? item.body : "";
            const subject = typeof item.subject === "string" ? item.subject : undefined;
            const updatedAt = typeof item.updated_at === "string" && item.updated_at.trim()
                ? item.updated_at
                : nowIso;

            return {
                id,
                name,
                type: normalizeTemplateType(item.type),
                trigger_event: triggerEvent,
                trigger_label: triggerLabel,
                subject,
                body,
                is_active: typeof item.is_active === "boolean" ? item.is_active : true,
                updated_at: updatedAt,
            };
        })
        .filter((item): item is NotificationTemplatePayload => item !== null);

    return normalized.slice(0, 200);
}

function normalizeEmailHistory(value: unknown): EmailHistoryItemPayload[] {
    if (!Array.isArray(value)) return [];

    const nowIso = new Date().toISOString();
    const normalized = value
        .map((item, index): EmailHistoryItemPayload | null => {
            if (!isRecord(item)) return null;

            const id = typeof item.id === "string" && item.id.trim()
                ? item.id
                : `mail-${index + 1}`;
            const recipient = typeof item.recipient === "string" ? item.recipient : "";
            const subject = typeof item.subject === "string" ? item.subject : "";
            const sentAt = typeof item.sent_at === "string" && item.sent_at.trim()
                ? item.sent_at
                : nowIso;

            return {
                id,
                recipient,
                subject,
                status: normalizeEmailStatus(item.status),
                sent_at: sentAt,
            };
        })
        .filter((item): item is EmailHistoryItemPayload => item !== null);

    return normalized.slice(0, 100);
}

export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_notifications", "read");

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

        // Extract notification settings from tenant settings
        const tenantSettings = (tenant.settings ?? {}) as Record<string, unknown>;
        const notificationSettings = (tenantSettings.notifications ?? {}) as Record<string, unknown>;
        const notificationTypes = normalizeNotificationTypes(notificationSettings.notification_types);
        const templates = normalizeNotificationTemplates(notificationSettings.templates);
        const emailHistory = normalizeEmailHistory(notificationSettings.email_history);

        return jsonOk(
            {
                enabled: notificationSettings.enabled ?? true,
                email_notifications: notificationSettings.email_notifications ?? true,
                slack_notifications: notificationSettings.slack_notifications ?? false,
                webhook_url: notificationSettings.webhook_url ?? null,
                notification_types: Object.keys(notificationTypes).length > 0 ? notificationTypes : {
                    new_user: true,
                    role_change: true,
                    content_published: true,
                    system_alert: true,
                },
                templates,
                email_history: emailHistory,
                sites: (sites ?? []).map((site) => ({
                    id: site.id,
                    name: site.name,
                    notifications_enabled: ((site.settings ?? {}) as Record<string, unknown>).notifications_enabled ?? true,
                })),
            },
            200,
            rateLimitHeaders(rateLimit),
        );
});

export const PATCH = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);
        const body = await parseJson(req);

        assertAdminRole(ctx.role, "Yönetici yetkisi gerekli");

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
            templates,
            email_history,
        } = body as {
            enabled?: boolean;
            email_notifications?: boolean;
            slack_notifications?: boolean;
            webhook_url?: string | null;
            notification_types?: Record<string, boolean>;
            templates?: unknown[];
            email_history?: unknown[];
        };

        if (templates !== undefined && !Array.isArray(templates)) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "templates alanı dizi olmalıdır",
            });
        }

        if (email_history !== undefined && !Array.isArray(email_history)) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "email_history alanı dizi olmalıdır",
            });
        }

        // Get current tenant
        const { data: tenant, error: tenantError } = await ctx.admin
            .from("tenants")
            .select("*")
            .eq("id", ctx.tenant.id)
            .single();

        if (tenantError) throw mapPostgrestError(tenantError);

        const tenantSettings = (tenant.settings ?? {}) as Record<string, unknown>;
        const currentNotifications = (tenantSettings.notifications ?? {}) as Record<string, unknown>;
        const normalizedNotificationTypes = notification_types === undefined
            ? undefined
            : normalizeNotificationTypes(notification_types);
        const normalizedTemplates = templates === undefined
            ? undefined
            : normalizeNotificationTemplates(templates);
        const normalizedEmailHistory = email_history === undefined
            ? undefined
            : normalizeEmailHistory(email_history);

        // Update notification settings
        const updatedNotifications = {
            ...currentNotifications,
            ...(enabled !== undefined && { enabled }),
            ...(email_notifications !== undefined && { email_notifications }),
            ...(slack_notifications !== undefined && { slack_notifications }),
            ...(webhook_url !== undefined && { webhook_url }),
            ...(normalizedNotificationTypes !== undefined && { notification_types: normalizedNotificationTypes }),
            ...(normalizedTemplates !== undefined && { templates: normalizedTemplates }),
            ...(normalizedEmailHistory !== undefined && { email_history: normalizedEmailHistory }),
        };

        const updatedSettings = {
            ...tenantSettings,
            notifications: updatedNotifications,
        };

        const { data: updatedTenant, error: updateError } = await ctx.admin
            .from("tenants")
            .update({ settings: updatedSettings })
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

        const updatedTenantSettings = (updatedTenant.settings ?? {}) as Record<string, unknown>;
        const finalNotifications = (updatedTenantSettings.notifications ?? {}) as Record<string, unknown>;
        const finalNotificationTypes = normalizeNotificationTypes(finalNotifications.notification_types);
        const finalTemplates = normalizeNotificationTemplates(finalNotifications.templates);
        const finalEmailHistory = normalizeEmailHistory(finalNotifications.email_history);

        return jsonOk({
            enabled: finalNotifications.enabled ?? true,
            email_notifications: finalNotifications.email_notifications ?? true,
            slack_notifications: finalNotifications.slack_notifications ?? false,
            webhook_url: finalNotifications.webhook_url ?? null,
            notification_types: finalNotificationTypes,
            templates: finalTemplates,
            email_history: finalEmailHistory,
        });
});
