import { moduleInstanceSchema, moduleKeySchema, uuidSchema } from "@prosektor/contracts";
import { z } from "zod";
import {
  asErrorBody,
  asHeaders,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";
import { deleteCachedValue, getOrSetCachedValue } from "@/server/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MODULES_CACHE_TTL_SEC = 60;
const MODULES_CACHE_PREFIX = "modules";
const PUBLIC_MODULE_CACHE_PREFIX = "public-module-enabled";

function getModulesCacheKey(tenantId: string, siteId: string): string {
  return [MODULES_CACHE_PREFIX, tenantId, siteId].join("|");
}

function getPublicModuleCacheKey(siteId: string, moduleKey: string): string {
  return [PUBLIC_MODULE_CACHE_PREFIX, siteId, moduleKey].join("|");
}

const getModulesQuerySchema = z.object({
  site_id: uuidSchema,
});

const upsertModuleRequestSchema = z
  .object({
    site_id: uuidSchema,
    module_key: moduleKeySchema,
    enabled: z.boolean().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    const url = new URL(req.url);

    const parsedQuery = getModulesQuerySchema.safeParse({
      site_id: url.searchParams.get("site_id"),
    });
    if (!parsedQuery.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsedQuery.error),
      });
    }

    const cacheKey = getModulesCacheKey(ctx.tenant.id, parsedQuery.data.site_id);
    const payload = await getOrSetCachedValue(cacheKey, MODULES_CACHE_TTL_SEC, async () => {
      const { data, error } = await ctx.supabase
        .from("module_instances")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .eq("site_id", parsedQuery.data.site_id)
        .order("module_key", { ascending: true });
      if (error) throw mapPostgrestError(error);
      return (data ?? []).map((m) => moduleInstanceSchema.parse(m));
    });

    return jsonOk(payload);
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

// Compat: POST /api/modules (upsert by site_id+module_key)
export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);
    const body = await parseJson(req);

    const parsed = upsertModuleRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    // Read existing to avoid overwriting fields the caller didn't provide.
    const { data: existing, error: existingError } = await ctx.supabase
      .from("module_instances")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", parsed.data.site_id)
      .eq("module_key", parsed.data.module_key)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);

    if (!existing) {
      const { data: inserted, error: insertError } = await ctx.supabase
        .from("module_instances")
        .insert({
          tenant_id: ctx.tenant.id,
          site_id: parsed.data.site_id,
          module_key: parsed.data.module_key,
          enabled: parsed.data.enabled ?? false,
          settings: parsed.data.settings ?? {},
        })
        .select("*")
        .single();
      if (insertError) throw mapPostgrestError(insertError);

      // Audit (service role required)
      {
        const nowIso = new Date().toISOString();
        const { error: auditError } = await ctx.admin.from("audit_logs").insert({
          tenant_id: ctx.tenant.id,
          actor_id: ctx.user.id,
          action: "module_create",
          entity_type: "module_instance",
          entity_id: inserted.id,
          changes: {
            enabled: { from: null, to: inserted.enabled },
            settings_keys: Object.keys(parsed.data.settings ?? {}),
          },
          meta: { site_id: inserted.site_id, module_key: inserted.module_key },
          created_at: nowIso,
        });
        if (auditError) throw mapPostgrestError(auditError);
      }

      deleteCachedValue(getModulesCacheKey(ctx.tenant.id, parsed.data.site_id));
      deleteCachedValue(getPublicModuleCacheKey(parsed.data.site_id, parsed.data.module_key));

      return jsonOk(moduleInstanceSchema.parse(inserted));
    }

    const mergedSettings =
      parsed.data.settings !== undefined
        ? { ...(existing.settings ?? {}), ...parsed.data.settings }
        : existing.settings ?? {};

    const { data: updated, error: updateError } = await ctx.supabase
      .from("module_instances")
      .update({
        enabled: parsed.data.enabled ?? existing.enabled,
        settings: mergedSettings,
      })
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (updateError) throw mapPostgrestError(updateError);

    // Audit (service role required)
    {
      const enabledBefore = existing.enabled;
      const enabledAfter = updated.enabled;
      const enabledChanged = enabledBefore !== enabledAfter;
      const settingsKeysChanged = Object.keys(parsed.data.settings ?? {});

      const nowIso = new Date().toISOString();
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: enabledChanged ? "module_toggle" : "module_update",
        entity_type: "module_instance",
        entity_id: updated.id,
        changes: {
          enabled: enabledChanged ? { from: enabledBefore, to: enabledAfter } : null,
          settings_keys: settingsKeysChanged,
        },
        meta: { site_id: updated.site_id, module_key: updated.module_key },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    deleteCachedValue(getModulesCacheKey(ctx.tenant.id, parsed.data.site_id));
    deleteCachedValue(getPublicModuleCacheKey(parsed.data.site_id, parsed.data.module_key));

    return jsonOk(moduleInstanceSchema.parse(updated));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
