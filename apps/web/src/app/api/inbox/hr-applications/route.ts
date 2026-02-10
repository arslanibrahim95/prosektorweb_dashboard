import {
  jobApplicationSchema,
  listJobApplicationsResponseSchema,
  uuidSchema,
} from "@prosektor/contracts";
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

const inboxApplicationsQuerySchema = z
  .object({
    site_id: uuidSchema,
    job_post_id: uuidSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    search: z.string().min(1).optional(),
    status: z.enum(["read", "unread"]).optional(),
    date_from: z.string().min(1).optional(),
    date_to: z.string().min(1).optional(),
  })
  .strict();

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const url = new URL(req.url);
    const qp = url.searchParams;

    const parsed = inboxApplicationsQuerySchema.safeParse({
      site_id: qp.get("site_id"),
      job_post_id: qp.get("job_post_id") ?? undefined,
      page: qp.get("page") ?? undefined,
      limit: qp.get("limit") ?? undefined,
      search: qp.get("search") ?? undefined,
      status: qp.get("status") ?? undefined,
      date_from: qp.get("date_from") ?? undefined,
      date_to: qp.get("date_to") ?? undefined,
    });
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const from = (parsed.data.page - 1) * parsed.data.limit;
    const to = from + parsed.data.limit - 1;

    let query = ctx.supabase
      .from("job_applications")
      .select("*, job_post:job_posts(id,title)", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", parsed.data.site_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (parsed.data.job_post_id) query = query.eq("job_post_id", parsed.data.job_post_id);
    if (parsed.data.status === "read") query = query.eq("is_read", true);
    if (parsed.data.status === "unread") query = query.eq("is_read", false);
    if (parsed.data.date_from) query = query.gte("created_at", parsed.data.date_from);
    if (parsed.data.date_to) query = query.lte("created_at", parsed.data.date_to);
    if (parsed.data.search) {
      const term = parsed.data.search.replace(/%/g, "\\%");
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data, error, count } = await query;
    if (error) throw mapPostgrestError(error);

    const response = listJobApplicationsResponseSchema.parse({
      items: (data ?? []).map((a) => jobApplicationSchema.parse(a)),
      total: count ?? 0,
    });

    return jsonOk(response);
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

