import { jobApplicationSchema, uuidSchema } from "@prosektor/contracts";
import { z } from "zod";
import { NextResponse } from "next/server";
import { toCsv } from "@/server/api/csv";
import {
  asHeaders,
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  mapPostgrestError,
  zodErrorToDetails,
} from "@/server/api/http";
import { buildSafeIlikeOr, safeSearchParamSchema } from "@/server/api/postgrest-search";
import { requireAuthContext } from "@/server/auth/context";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const exportApplicationsQuerySchema = z
  .object({
    site_id: uuidSchema,
    job_post_id: uuidSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(2000).default(1000),
    search: safeSearchParamSchema.optional(),
    status: z.enum(["read", "unread"]).optional(),
    date_from: z.string().min(1).optional(),
    date_to: z.string().min(1).optional(),
    format: z.string().optional(), // compat: frontend sets `format=csv`
  })
  .strict();

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const env = getServerEnv();
    const url = new URL(req.url);
    const qp = url.searchParams;

    const parsed = exportApplicationsQuerySchema.safeParse({
      site_id: qp.get("site_id") ?? undefined,
      job_post_id: qp.get("job_post_id") ?? undefined,
      page: qp.get("page") ?? undefined,
      limit: qp.get("limit") ?? undefined,
      search: qp.get("search") ?? undefined,
      status: qp.get("status") ?? undefined,
      date_from: qp.get("date_from") ?? undefined,
      date_to: qp.get("date_to") ?? undefined,
      format: qp.get("format") ?? undefined,
    });
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const rateLimit = await enforceRateLimit(
      ctx.admin,
      rateLimitAuthKey("inbox_applications_export", ctx.tenant.id, ctx.user.id),
      env.dashboardExportRateLimit,
      env.dashboardExportRateWindowSec,
    );

    const from = (parsed.data.page - 1) * parsed.data.limit;
    const to = from + parsed.data.limit - 1;

    let query = ctx.supabase
      .from("job_applications")
      .select("*, job_post:job_posts(id,title)")
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
      query = query.or(buildSafeIlikeOr(["full_name", "email"], parsed.data.search));
    }

    const { data, error } = await query;
    if (error) throw mapPostgrestError(error);

    const items = (data ?? []).map((a) => jobApplicationSchema.parse(a));

    const headers = [
      "id",
      "created_at",
      "full_name",
      "email",
      "phone",
      "job_post_id",
      "job_post_title",
      "message",
      "is_read",
      "kvkk_accepted_at",
    ];

    const rows = items.map((a) => [
      a.id,
      a.created_at,
      a.full_name,
      a.email,
      a.phone,
      a.job_post_id,
      a.job_post?.title ?? "",
      a.message ?? "",
      a.is_read,
      a.kvkk_accepted_at,
    ]);

    const csv = toCsv(headers, rows);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `applications_${parsed.data.site_id}_${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
        ...rateLimitHeaders(rateLimit),
      },
    });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
