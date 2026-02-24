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
import { getCacheStats, clearCacheStore, cacheStore } from "@/server/cache";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultCacheSettings = {
    auto_purge: true,
    purge_interval: "daily" as const,
    max_size_mb: 1024,
    enabled_types: ["query", "api", "static"],
};

interface PostgrestLikeError {
    code?: string | null;
}

function isMissingCacheSettingsResourceError(error: PostgrestLikeError | null | undefined): boolean {
    if (!error?.code) return false;
    return (
        error.code === "42P01" || // relation does not exist
        error.code === "42703" || // column does not exist
        error.code === "PGRST204" || // missing column in schema cache
        error.code === "PGRST205" // table not present in schema cache
    );
}

const cacheSettingsSchema = z.object({
    auto_purge: z.boolean().optional(),
    purge_interval: z.enum(["hourly", "every6hours", "daily", "weekly"]).optional(),
    max_size_mb: z.number().min(128).max(10240).optional(),
    enabled_types: z.array(z.string()).optional(),
});

// GET /api/admin/cache - Get cache stats and settings
export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_cache", "read");

        // Get cache settings from database
        const { data: settings, error: settingsError } = await ctx.admin
            .from("cache_settings")
            .select("*")
            .eq("tenant_id", ctx.tenant.id)
            .single();

        const cacheSettingsTableMissing = isMissingCacheSettingsResourceError(settingsError);

        if (settingsError && settingsError.code !== "PGRST116" && !cacheSettingsTableMissing) {
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
        if (!settings && !cacheSettingsTableMissing) {
            const { error: insertError } = await ctx.admin.from("cache_settings").insert({
                tenant_id: ctx.tenant.id,
                ...defaultCacheSettings,
            });
            if (insertError && !isMissingCacheSettingsResourceError(insertError)) {
                throw mapPostgrestError(insertError);
            }
        }

        return jsonOk(
            {
                settings: settings || defaultCacheSettings,
                stats: cacheStats,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
});

// PATCH /api/admin/cache - Update cache settings
export const PATCH = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_cache", "read");

        const body = await parseJson(req);
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

        if (isMissingCacheSettingsResourceError(settingsError)) {
            throw new HttpError(503, {
                code: "INTERNAL_ERROR",
                message: "Cache ayarlari tablosu bulunamadi. Veritabani migrasyonlarini calistirin.",
            });
        }

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
});

// Legacy PUT handler (same as PATCH)
export async function PUT(req: Request) {
    return PATCH(req);
}

// DELETE /api/admin/cache - Clear cache
export const DELETE = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_cache", {
            limit: 10,
            windowSeconds: 60,
        });

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
});
