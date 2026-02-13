import { moduleInstanceSchema, updateModuleInstanceRequestSchema } from "@prosektor/contracts";
import {
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = updateModuleInstanceRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data: existing, error: existingError } = await ctx.supabase
      .from("module_instances")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw mapPostgrestError(existingError);
    if (!existing) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const mergedSettings =
      parsed.data.settings !== undefined
        ? { ...(existing.settings ?? {}), ...parsed.data.settings }
        : existing.settings ?? {};

    const updateRow: Record<string, unknown> = {
      settings: mergedSettings,
    };
    if (parsed.data.enabled !== undefined) updateRow.enabled = parsed.data.enabled;

    const { data, error } = await ctx.supabase
      .from("module_instances")
      .update(updateRow)
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw mapPostgrestError(error);

    // Audit (service role required)
    {
      const enabledBefore = existing.enabled;
      const enabledAfter = (data as { enabled: boolean }).enabled;
      const enabledChanged = enabledBefore !== enabledAfter;
      const settingsKeysChanged = Object.keys(parsed.data.settings ?? {});

      const nowIso = new Date().toISOString();
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: enabledChanged ? "module_toggle" : "module_update",
        entity_type: "module_instance",
        entity_id: existing.id,
        changes: {
          enabled: enabledChanged ? { from: enabledBefore, to: enabledAfter } : null,
          settings_keys: settingsKeysChanged,
        },
        meta: { site_id: existing.site_id, module_key: existing.module_key },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    return jsonOk(moduleInstanceSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
