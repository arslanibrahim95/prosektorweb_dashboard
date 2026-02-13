import {
  seoSettingsSchema,
  updateSEOSettingsRequestSchema,
  getSEOSettingsResponseSchema,
} from "@prosektor/contracts";
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

/**
 * GET /api/sites/[id]/seo
 * Get SEO settings for a site
 */
export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;

    const { data, error } = await ctx.supabase
      .from("sites")
      .select("settings")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Site not found" });

    // Extract SEO settings from site settings JSONB
    const seoSettings = (data.settings as Record<string, unknown>).seo ?? {
      title_template: "%s | %s",
      default_description: "",
      og_image: null,
      robots_txt: null,
    };

    return jsonOk(getSEOSettingsResponseSchema.parse(seoSettings));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

/**
 * PUT /api/sites/[id]/seo
 * Update SEO settings for a site
 */
export async function PUT(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = updateSEOSettingsRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    // Get current site settings
    const { data: currentSite, error: fetchError } = await ctx.supabase
      .from("sites")
      .select("settings")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw mapPostgrestError(fetchError);
    if (!currentSite) throw new HttpError(404, { code: "NOT_FOUND", message: "Site not found" });

    // Merge SEO settings into site settings
    const currentSettings = (currentSite.settings as Record<string, unknown>) ?? {};
    const currentSeo = (currentSettings.seo as Record<string, unknown>) ?? {};

    const updatedSeo = { ...currentSeo, ...parsed.data };
    const updatedSettings = { ...currentSettings, seo: updatedSeo };

    // Update site with new settings
    const { data, error } = await ctx.supabase
      .from("sites")
      .update({ settings: updatedSettings })
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .select("settings")
      .maybeSingle();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Site not found" });

    return jsonOk(getSEOSettingsResponseSchema.parse(updatedSeo));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
