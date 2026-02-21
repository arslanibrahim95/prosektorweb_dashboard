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
import { deepMerge } from "@/utils/object";
import { settingsPatchSchema } from "@/schemas/admin-settings";

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
    // Auth + role check ÖNCE
    const ctx = await requireAuthContext(req);
    assertAdminRole(ctx.role, "Yönetici yetkisi gerekli");

    // Rate limit — write işlemi (parse öncesi)
    const rateLimit = await enforceAdminRateLimit(ctx, "admin_settings", "write");

    const rawBody = await parseJson(req);

    // Validate request body with Zod schema
    const parsed = settingsPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
        throw new HttpError(400, {
            code: "VALIDATION_ERROR",
            message: "Geçersiz istek gövdesi",
            details: zodErrorToDetails(parsed.error),
        });
    }

    const { tenant, site, security, backup, i18n, theme } = parsed.data;

    // Plan updates require owner role (privilege escalation prevention)
    if (tenant?.plan) {
        assertOwnerRole(ctx.role, "Plan değişikliği sadece workspace sahibi tarafından yapılabilir");
    }

    const nowIso = new Date().toISOString();

    // ─── TEK OKUMA: mevcut tenant ayarlarını çek ───────────────────────
    const { data: currentTenant, error: fetchError } = await ctx.admin
        .from("tenants")
        .select("name, plan, settings")
        .eq("id", ctx.tenant.id)
        .single();

    if (fetchError) throw mapPostgrestError(fetchError);
    if (!currentTenant) {
        throw new HttpError(404, { code: "NOT_FOUND", message: "Tenant bulunamadı" });
    }

    // ─── MEMORY'DE MERGE (Deep Merge - veri kaybı yok) ─────────────────
    const currentSettings = (currentTenant.settings ?? {}) as Record<string, unknown>;
    const settingsUpdate = deepMerge<Record<string, unknown>>({}, currentSettings);

    if (security) {
        settingsUpdate.security = deepMerge(
            (currentSettings.security as Record<string, unknown>) ?? {},
            security as Record<string, unknown>,
        );
    }
    if (backup) {
        settingsUpdate.backup = deepMerge(
            (currentSettings.backup as Record<string, unknown>) ?? {},
            backup as Record<string, unknown>,
        );
    }
    if (i18n) {
        settingsUpdate.i18n = deepMerge(
            (currentSettings.i18n as Record<string, unknown>) ?? {},
            i18n as Record<string, unknown>,
        );
    }
    if (theme) {
        settingsUpdate.theme = deepMerge(
            (currentSettings.theme as Record<string, unknown>) ?? {},
            theme as Record<string, unknown>,
        );
    }

    // Tenant flat fields
    const tenantFlatUpdate: Record<string, unknown> = {};
    if (tenant?.name) tenantFlatUpdate.name = tenant.name;
    if (tenant?.plan) tenantFlatUpdate.plan = tenant.plan;
    const tenantUpdatePayload: Record<string, unknown> = {
        settings: settingsUpdate,
    };
    if ("name" in tenantFlatUpdate) tenantUpdatePayload.name = tenantFlatUpdate.name;
    if ("plan" in tenantFlatUpdate) tenantUpdatePayload.plan = tenantFlatUpdate.plan;

    // ─── TEK YAZMA: tek UPDATE sorgusu ─────────────────────────────────
    const { data: updatedTenant, error: updateError } = await ctx.admin
        .from("tenants")
        .update(tenantUpdatePayload)
        .eq("id", ctx.tenant.id)
        .select("name, plan, settings")
        .single();

    if (updateError) throw mapPostgrestError(updateError);

    // ─── SITE UPDATE (varsa) ────────────────────────────────────────────
    let updatedSite: unknown = null;
    if (site?.id && site.settings) {
        const { data: siteData, error: siteError } = await ctx.admin
            .from("sites")
            .update({ settings: site.settings })
            .eq("id", site.id)
            .eq("tenant_id", ctx.tenant.id)
            .select("*")
            .single();

        if (siteError) throw mapPostgrestError(siteError);
        updatedSite = siteData;
    }

    // ─── BULK AUDIT LOG (tek insert) ────────────────────────────────────
    const auditLogsToInsert: Array<Record<string, unknown>> = [];

    if (Object.keys(tenantFlatUpdate).length > 0) {
        auditLogsToInsert.push({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "settings_update",
            entity_type: "tenant",
            entity_id: ctx.tenant.id,
            changes: { tenant: { from: null, to: tenantFlatUpdate } },
            meta: null,
            created_at: nowIso,
        });
    }
    if (security) {
        auditLogsToInsert.push({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "security_settings_update",
            entity_type: "tenant",
            entity_id: ctx.tenant.id,
            changes: { security: { from: currentSettings.security ?? null, to: security } },
            meta: null,
            created_at: nowIso,
        });
    }
    if (backup) {
        auditLogsToInsert.push({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "backup_settings_update",
            entity_type: "tenant",
            entity_id: ctx.tenant.id,
            changes: { backup: { from: currentSettings.backup ?? null, to: backup } },
            meta: null,
            created_at: nowIso,
        });
    }
    if (i18n) {
        auditLogsToInsert.push({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "i18n_settings_update",
            entity_type: "tenant",
            entity_id: ctx.tenant.id,
            changes: { i18n: { from: currentSettings.i18n ?? null, to: i18n } },
            meta: null,
            created_at: nowIso,
        });
    }
    if (theme) {
        auditLogsToInsert.push({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "theme_settings_update",
            entity_type: "tenant",
            entity_id: ctx.tenant.id,
            changes: { theme: { from: currentSettings.theme ?? null, to: theme } },
            meta: null,
            created_at: nowIso,
        });
    }
    if (updatedSite && site) {
        auditLogsToInsert.push({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "settings_update",
            entity_type: "site",
            entity_id: site.id,
            changes: { settings: { from: null, to: site.settings } },
            meta: null,
            created_at: nowIso,
        });
    }

    if (auditLogsToInsert.length > 0) {
        const { error: auditError } = await ctx.admin
            .from("audit_logs")
            .insert(auditLogsToInsert);
        if (auditError) {
            // NON-BLOCKING: Ana işlem başarılıysa audit hatası kullanıcıya yansımasın
            console.error("[AUDIT] audit_logs bulk insert failed:", auditError);
        }
    }

    // ─── TEMİZ RESPONSE ────────────────────────────────────────────────
    return jsonOk(
        { tenant: updatedTenant, site: updatedSite },
        200,
        rateLimitHeaders(rateLimit),
    );
});
