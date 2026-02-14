import {
  createDomainRequestSchema,
  domainNameSchema,
  domainSchema,
  listDomainsQuerySchema,
  listDomainsResponseSchema,
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
import { clearOriginDecisionCache } from "@/server/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/\/.*$/, "");
  return d;
}

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const url = new URL(req.url);

    const parsedQuery = listDomainsQuerySchema.safeParse({
      site_id: url.searchParams.get("site_id"),
    });
    if (!parsedQuery.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsedQuery.error),
      });
    }

    const { data, error, count } = await ctx.supabase
      .from("domains")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", parsedQuery.data.site_id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw mapPostgrestError(error);

    const response = listDomainsResponseSchema.parse({
      items: (data ?? []).map((d) => domainSchema.parse(d)),
      total: count ?? 0,
    });

    return jsonOk(response);
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const body = await parseJson(req);

    const parsed = createDomainRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const normalizedDomain = normalizeDomain(parsed.data.domain);
    const domainParsed = domainNameSchema.safeParse(normalizedDomain);
    if (!domainParsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { domain: domainParsed.error.issues.map((i) => i.message) },
      });
    }

    const nowIso = new Date().toISOString();

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("domains")
      .insert({
        tenant_id: ctx.tenant.id,
        site_id: parsed.data.site_id,
        domain: normalizedDomain,
        is_primary: parsed.data.is_primary ?? false,
      })
      .select("*")
      .single();
    if (insertError) throw mapPostgrestError(insertError);

    // If set as primary, ensure only one primary per site (best-effort, no txn).
    let finalRow = inserted;
    if (inserted.is_primary) {
      const { error: clearPrimaryError } = await ctx.supabase
        .from("domains")
        .update({ is_primary: false })
        .eq("tenant_id", ctx.tenant.id)
        .eq("site_id", inserted.site_id)
        .neq("id", inserted.id);
      if (clearPrimaryError) throw mapPostgrestError(clearPrimaryError);

      const { data: reloaded, error: reloadError } = await ctx.supabase
        .from("domains")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .eq("id", inserted.id)
        .single();
      if (reloadError) throw mapPostgrestError(reloadError);
      finalRow = reloaded;
    }

    // Audit (service role required)
    {
      const { error: auditError } = await ctx.admin.from("audit_logs").insert({
        tenant_id: ctx.tenant.id,
        actor_id: ctx.user.id,
        action: "domain_create",
        entity_type: "domain",
        entity_id: finalRow.id,
        changes: { is_primary: finalRow.is_primary },
        meta: { site_id: finalRow.site_id },
        created_at: nowIso,
      });
      if (auditError) throw mapPostgrestError(auditError);
    }

    clearOriginDecisionCache();
    return jsonOk(domainSchema.parse(finalRow));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
