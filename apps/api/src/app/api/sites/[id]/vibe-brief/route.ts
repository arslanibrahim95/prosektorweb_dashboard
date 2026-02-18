import {
  saveVibeBriefRequestSchema,
  saveVibeBriefResponseSchema,
  siteSchema,
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

type JsonObject = Record<string, unknown>;

function toJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonObject;
}

export async function POST(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = saveVibeBriefRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data: siteData, error: siteError } = await ctx.supabase
      .from("sites")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (siteError) throw mapPostgrestError(siteError);
    if (!siteData) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const now = new Date().toISOString();
    const previousSettings = toJsonObject(siteData.settings);
    const nextSettings: JsonObject = {
      ...previousSettings,
      vibe_brief: {
        business_name: parsed.data.business_name,
        business_summary: parsed.data.business_summary,
        target_audience: parsed.data.target_audience,
        tone_keywords: parsed.data.tone_keywords,
        goals: parsed.data.goals,
        must_have_sections: parsed.data.must_have_sections,
        primary_cta: parsed.data.primary_cta,
        updated_at: now,
      },
      generation_mode: "vibe",
    };

    const { data: updatedSite, error: updateSiteError } = await ctx.supabase
      .from("sites")
      .update({ settings: nextSettings })
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (updateSiteError) throw mapPostgrestError(updateSiteError);
    if (!updatedSite) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    let homepage: { id: string; origin: "panel" | "site_engine" | "unknown" } | null = null;

    if (parsed.data.create_panel_homepage) {
      const { data: existingHomepageRows, error: homepageQueryError } = await ctx.supabase
        .from("pages")
        .select("id, origin")
        .eq("tenant_id", ctx.tenant.id)
        .eq("site_id", id)
        .eq("slug", "")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(1);
      if (homepageQueryError) throw mapPostgrestError(homepageQueryError);

      const existingHomepage = (existingHomepageRows ?? [])[0] ?? null;

      if (existingHomepage) {
        const { data: patchedHomepage, error: patchHomepageError } = await ctx.supabase
          .from("pages")
          .update({
            title: "Ana Sayfa",
            seo: {
              title: parsed.data.business_name,
              description: parsed.data.business_summary.slice(0, 160),
            },
          })
          .eq("tenant_id", ctx.tenant.id)
          .eq("id", existingHomepage.id)
          .select("id, origin")
          .single();
        if (patchHomepageError) throw mapPostgrestError(patchHomepageError);

        homepage = {
          id: patchedHomepage.id,
          origin: patchedHomepage.origin,
        };
      } else {
        const { data: insertedHomepage, error: insertHomepageError } = await ctx.supabase
          .from("pages")
          .insert({
            tenant_id: ctx.tenant.id,
            site_id: id,
            slug: "",
            title: "Ana Sayfa",
            origin: "panel",
            seo: {
              title: parsed.data.business_name,
              description: parsed.data.business_summary.slice(0, 160),
            },
          })
          .select("id, origin")
          .single();
        if (insertHomepageError) throw mapPostgrestError(insertHomepageError);

        homepage = {
          id: insertedHomepage.id,
          origin: insertedHomepage.origin,
        };
      }
    }

    return jsonOk(
      saveVibeBriefResponseSchema.parse({
        site: siteSchema.parse(updatedSite),
        homepage,
      }),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
