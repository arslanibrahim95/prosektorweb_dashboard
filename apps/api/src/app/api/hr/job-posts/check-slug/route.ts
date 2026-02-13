import { uuidSchema } from "@prosektor/contracts";
import { z } from "zod";
import {
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkSlugQuerySchema = z
  .object({
    slug: z.string().min(1).max(200),
    exclude_id: uuidSchema.optional(),
    site_id: uuidSchema.optional(),
  })
  .strict();

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const url = new URL(req.url);
    const qp = url.searchParams;

    const parsed = checkSlugQuerySchema.safeParse({
      slug: qp.get("slug"),
      exclude_id: qp.get("exclude_id") ?? undefined,
      site_id: qp.get("site_id") ?? undefined,
    });
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    let siteId = parsed.data.site_id;
    if (!siteId) {
      const { data: firstSite, error: firstSiteError } = await ctx.supabase
        .from("sites")
        .select("id")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (firstSiteError) throw mapPostgrestError(firstSiteError);
      if (!firstSite) throw new HttpError(404, { code: "NOT_FOUND", message: "No site found" });
      siteId = firstSite.id;
    }

    let query = ctx.supabase
      .from("job_posts")
      .select("id")
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", siteId)
      .eq("slug", parsed.data.slug)
      .is("deleted_at", null);

    if (parsed.data.exclude_id) query = query.neq("id", parsed.data.exclude_id);

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw mapPostgrestError(error);

    return jsonOk({ available: !data });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

