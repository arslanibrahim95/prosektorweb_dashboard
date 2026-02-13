import {
  createJobPostRequestSchema,
  jobPostSchema,
  listJobPostsQuerySchema,
  listJobPostsResponseSchema,
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

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const url = new URL(req.url);
    const qp = url.searchParams;

    const parsed = listJobPostsQuerySchema.safeParse({
      site_id: qp.get("site_id"),
      include_deleted: qp.get("include_deleted") ?? undefined,
    });
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    let query = ctx.supabase
      .from("job_posts")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", parsed.data.site_id)
      .order("created_at", { ascending: false });

    if (!parsed.data.include_deleted) query = query.is("deleted_at", null);

    const { data, error, count } = await query;
    if (error) throw mapPostgrestError(error);

    const response = listJobPostsResponseSchema.parse({
      items: (data ?? []).map((p) => jobPostSchema.parse(p)),
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

    const parsed = createJobPostRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data, error } = await ctx.supabase
      .from("job_posts")
      .insert({
        tenant_id: ctx.tenant.id,
        site_id: parsed.data.site_id,
        title: parsed.data.title,
        slug: parsed.data.slug,
        location: parsed.data.location ?? null,
        employment_type: parsed.data.employment_type ?? null,
        description: parsed.data.description ?? null,
        requirements: parsed.data.requirements ?? null,
        is_active: parsed.data.is_active ?? true,
      })
      .select("*")
      .single();

    if (error) throw mapPostgrestError(error);
    return jsonOk(jobPostSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

