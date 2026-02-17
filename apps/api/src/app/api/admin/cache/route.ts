import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { type UserRole } from "@prosektor/contracts";
import { requireAuthContext } from "@/server/auth/context";
import { isAdminRole } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { getCacheStats, clearCacheStore, cacheStore, MAX_CACHE_ENTRIES } from "@/server/cache";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertAdminRole(role: UserRole) {
    if (!isAdminRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
    }
}

const cacheSettingsSchema = z.object({
    auto_purge: z.boolean().optional(),
    purge_interval: z.enum(["hourly", "every6hours", "daily", "weekly"]).optional(),
    max_size_mb: z.number().min(128).max(10240).optional(),
    enabled_types: z.array(z.string()).optional(),
});

// GET /api/admin/cache - Get cache stats and settings
export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_cache", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        // Get cache settings from database
        const { data: settings, error: settingsError } = await ctx.admin
            .from("cache_settings")
            .select("*")
            .eq("tenant_id", ctx.tenant.id)
            .single();

        if (settingsError && settingsError.code !== "PGRST116") {
            // PGRST116 = no rows returned
            throw mapPostgrestError(settingsError);
        }

        // Get cache stats from in-memory store
        const { size: cacheEntries, maxSize } = getCacheStats();

        const cacheStats = {
            entries: cacheEntries,
            maxEntries: maxSize,
            usagePercent: maxSize > 0 ? Math.round((cacheEntries / maxSize) * 100) : 0,
        };

        // If no settings exist, create default
        if (!settings) {
            await ctx.admin.from("cache_settings").insert({
                tenant_id: ctx.tenant.id,
                auto_purge: true,
                purge_interval: "daily",
                max_size_mb: 1024,
                enabled_types: ["query", "api", "static"],
            });
        }

        return jsonOk(
            {
                settings: settings || {
                    auto_purge: true,
                    purge_interval: "daily",
                    max_size_mb: 1024,
                    enabled_types: ["query", "api", "static"],
                },
                stats: cacheStats,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

// PATCH /api/admin/cache - Update cache settings
export async function PATCH(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_cache", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const body = await req.json();
        const parsed = cacheSettingsSchema.safeParse(body);

        if (!parsed.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Geçersiz parametreler",
            });
        }

        const updateData = {
            ...parsed.data,
            updated_at: new Date().toISOString(),
        };

        // Upsert cache settings
        const { data: settings, error: settingsError } = await ctx.admin
            .from("cache_settings")
            .upsert({
                tenant_id: ctx.tenant.id,
                ...updateData,
            }, { onConflict: "tenant_id" })
            .select()
            .single();

        if (settingsError) throw mapPostgrestError(settingsError);

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "cache_settings_update",
            entity_type: "cache_settings",
            meta: { changes: updateData },
        });

        return jsonOk({ settings }, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

// Legacy PUT handler (same as PATCH)
export async function PUT(req: Request) {
    return PATCH(req);
}

// DELETE /api/admin/cache - Clear cache
export async function DELETE(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_cache", ctx.tenant.id, ctx.user.id),
            10, // More restrictive for destructive operations
            60,
        );

        const url = new URL(req.url);
        const clearType = url.searchParams.get("type") || "all";

        let clearedEntries = 0;

        if (clearType === "all") {
            clearedEntries = clearCacheStore();
        } else {
            // Clear entries matching the given prefix
            const keysToDelete: string[] = [];
            for (const key of cacheStore.keys()) {
                if (key.startsWith(clearType)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach((key) => cacheStore.delete(key));
            clearedEntries = keysToDelete.length;
        }

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "cache_clear",
            entity_type: "cache",
            meta: { type: clearType, clearedEntries },
        });

        return jsonOk(
            {
                success: true,
                clearedEntries,
                type: clearType,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
