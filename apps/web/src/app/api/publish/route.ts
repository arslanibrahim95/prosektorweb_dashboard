import { publishSiteRequestSchema, publishSiteResponseSchema } from "@prosektor/contracts";
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

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const body = await parseJson(req);

    const parsed = publishSiteRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    // Authorization
    if (ctx.role === "viewer") {
      throw new HttpError(403, { code: "FORBIDDEN", message: "Forbidden" });
    }
    if (ctx.role === "editor" && parsed.data.environment !== "staging") {
      throw new HttpError(403, { code: "FORBIDDEN", message: "Forbidden" });
    }

    const nowIso = new Date().toISOString();

    // Use service role for publish + audit log (RLS blocks writes to audit_logs).
    const admin = ctx.admin;

    const { data: site, error: siteError } = await admin
      .from("sites")
      .select("id, tenant_id, status")
      .eq("id", parsed.data.site_id)
      .eq("tenant_id", ctx.tenant.id)
      .maybeSingle();
    if (siteError) throw mapPostgrestError(siteError);
    if (!site) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    if (parsed.data.environment === "production" && site.status !== "staging") {
      throw new HttpError(409, { code: "INVALID_STATE", message: "Site must be staging first" });
    }

    if (parsed.data.environment === "staging") {
      const { error: updateSiteError } = await admin
        .from("sites")
        .update({ status: "staging" })
        .eq("id", site.id)
        .eq("tenant_id", site.tenant_id);
      if (updateSiteError) throw mapPostgrestError(updateSiteError);

      const { data: pages, error: pagesError } = await admin
        .from("pages")
        .select("id, draft_revision_id")
        .eq("tenant_id", site.tenant_id)
        .eq("site_id", site.id)
        .is("deleted_at", null);
      if (pagesError) throw mapPostgrestError(pagesError);

      for (const p of pages ?? []) {
        if (!p.draft_revision_id) continue;
        const { error: pageUpdateError } = await admin
          .from("pages")
          .update({ staging_revision_id: p.draft_revision_id })
          .eq("tenant_id", site.tenant_id)
          .eq("id", p.id);
        if (pageUpdateError) throw mapPostgrestError(pageUpdateError);
      }
    } else {
      const { error: updateSiteError } = await admin
        .from("sites")
        .update({ status: "published" })
        .eq("id", site.id)
        .eq("tenant_id", site.tenant_id);
      if (updateSiteError) throw mapPostgrestError(updateSiteError);

      const { data: pages, error: pagesError } = await admin
        .from("pages")
        .select("id, staging_revision_id")
        .eq("tenant_id", site.tenant_id)
        .eq("site_id", site.id)
        .is("deleted_at", null);
      if (pagesError) throw mapPostgrestError(pagesError);

      for (const p of pages ?? []) {
        const update: Record<string, unknown> = { status: "published" };
        if (p.staging_revision_id) update.published_revision_id = p.staging_revision_id;

        const { error: pageUpdateError } = await admin
          .from("pages")
          .update(update)
          .eq("tenant_id", site.tenant_id)
          .eq("id", p.id);
        if (pageUpdateError) throw mapPostgrestError(pageUpdateError);
      }
    }

    const { error: auditError } = await admin.from("audit_logs").insert({
      tenant_id: site.tenant_id,
      actor_id: ctx.user.id,
      action: "publish",
      entity_type: "site",
      entity_id: site.id,
      changes: null,
      meta: { environment: parsed.data.environment },
      created_at: nowIso,
    });
    if (auditError) throw mapPostgrestError(auditError);

    const response = publishSiteResponseSchema.parse({
      site_id: parsed.data.site_id,
      environment: parsed.data.environment,
      published_at: nowIso,
    });

    return jsonOk(response);
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

