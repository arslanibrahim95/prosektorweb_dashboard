import {
  platformSettingsResponseSchema,
  platformSettingsUpdateRequestSchema,
  type UserRole,
} from "@prosektor/contracts";
import {
  asErrorBody,
  asStatus,
  asHeaders,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { isSuperAdminRole } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertSuperAdmin(role: UserRole) {
  if (!isSuperAdminRole(role)) {
    throw new HttpError(403, {
      code: "FORBIDDEN",
      message: "Bu işlem yalnızca super_admin için yetkilidir.",
    });
  }
}

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    assertSuperAdmin(ctx.role);

    const env = getServerEnv();
    const rateLimit = await enforceRateLimit(
      ctx.admin,
      rateLimitAuthKey("platform_settings", ctx.tenant.id, ctx.user.id),
      env.dashboardReadRateLimit,
      env.dashboardReadRateWindowSec,
    );

    const { data, error } = await ctx.admin
      .from("platform_settings")
      .select("key, value, updated_by, updated_at")
      .order("key", { ascending: true });

    if (error) throw mapPostgrestError(error);

    return jsonOk(
      platformSettingsResponseSchema.parse({
        items: data ?? [],
      }),
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
    assertSuperAdmin(ctx.role);

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

    const { data, error } = await ctx.admin
      .from("platform_settings")
      .select("key, value, updated_by, updated_at")
      .order("key", { ascending: true });

    if (error) throw mapPostgrestError(error);

    console.info("[platform-settings-update]", {
      actorId: ctx.user.id,
      auditId: auditRow.id,
      updatedKeys: parsedBody.data.items.map((item) => item.key),
    });

    return jsonOk(
      platformSettingsResponseSchema.parse({
        items: data ?? [],
      }),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
