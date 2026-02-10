import { moduleInstanceSchema, moduleKeySchema, uuidSchema } from "@prosektor/contracts";
import { z } from "zod";
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

    const { data, error } = await ctx.supabase
      .from("module_instances")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", parsedQuery.data.site_id)
      .order("module_key", { ascending: true });
    if (error) throw mapPostgrestError(error);

    return jsonOk((data ?? []).map((m) => moduleInstanceSchema.parse(m)));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

// Compat: POST /api/modules (upsert by site_id+module_key)
export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
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

    return jsonOk(moduleInstanceSchema.parse(updated));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
