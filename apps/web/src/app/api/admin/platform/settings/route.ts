import {
  platformSettingsResponseSchema,
  platformSettingsUpdateRequestSchema,
} from "@prosektor/contracts";
import {
  HttpError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertSuperAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";
import { deleteCachedValue, getOrSetCachedValue } from "@/server/cache";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PLATFORM_SETTINGS_CACHE_KEY = "platform-settings";
const PLATFORM_SETTINGS_CACHE_TTL_SEC = 120;

export const GET = withAdminErrorHandling(async (req: Request) => {
    const ctx = await requireAuthContext(req);
    assertSuperAdminRole(ctx.role);

    const rateLimit = await enforceAdminRateLimit(ctx, "platform_settings", "read");

    const payload = await getOrSetCachedValue(PLATFORM_SETTINGS_CACHE_KEY, PLATFORM_SETTINGS_CACHE_TTL_SEC, async () => {
      const { data, error } = await ctx.admin
        .from("platform_settings")
        .select("key, value, updated_by, updated_at")
        .order("key", { ascending: true });

      if (error) throw mapPostgrestError(error);

      return platformSettingsResponseSchema.parse({
        items: data ?? [],
      });
    });

    return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
});

export const PATCH = withAdminErrorHandling(async (req: Request) => {
    const ctx = await requireAuthContext(req);
    assertSuperAdminRole(ctx.role);

    const body = await parseJson(req);
    const parsedBody = platformSettingsUpdateRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsedBody.error),
      });
    }

    const nowIso = new Date().toISOString();
    const upsertRows = parsedBody.data.items.map((item) => ({
      key: item.key,
      value: item.value,
      updated_by: ctx.user.id,
      updated_at: nowIso,
    }));

    const { error: upsertError } = await ctx.admin
      .from("platform_settings")
      .upsert(upsertRows, { onConflict: "key" });
    if (upsertError) throw mapPostgrestError(upsertError);

    const { data: auditRow, error: auditError } = await ctx.admin
      .from("platform_audit_logs")
      .insert({
        actor_id: ctx.user.id,
        action: "platform_settings_update",
        entity_type: "platform_settings",
        entity_id: null,
        reason: "Platform settings updated",
        details: {
          keys: parsedBody.data.items.map((item) => item.key),
          count: parsedBody.data.items.length,
        },
      })
      .select("id")
      .single();
    if (auditError) throw mapPostgrestError(auditError);

    // Clear cached platform settings so subsequent reads always fetch fresh values.
    deleteCachedValue(PLATFORM_SETTINGS_CACHE_KEY);

    const { data, error } = await ctx.admin
      .from("platform_settings")
      .select("key, value, updated_by, updated_at")
      .order("key", { ascending: true });

    if (error) throw mapPostgrestError(error);

    logger.info("[platform-settings-update]", {
      actorId: ctx.user.id,
      auditId: auditRow.id,
      updatedKeys: parsedBody.data.items.map((item) => item.key),
    });

    return jsonOk(
      platformSettingsResponseSchema.parse({
        items: data ?? [],
      }),
    );
});
