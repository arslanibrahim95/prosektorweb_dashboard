import { z } from "zod";
import {
  createJobPostRequestSchema,
  jobPostSchema,
  listJobPostsQuerySchema,
} from "@prosektor/contracts";
import {
  asErrorBody,
  asHeaders,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  parseJson,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";
import { hasPermission } from "@/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pagination Schema
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);

    // Permission check - require granular hr:job_posts:read permission
    if (!hasPermission(ctx.permissions, 'hr:job_posts:read')) {
      throw new HttpError(403, {
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok.',
      });
    }

    const url = new URL(req.url);
    const qp = Object.fromEntries(url.searchParams);

    // Validate Query + Pagination
    const queryParams = listJobPostsQuerySchema.merge(paginationSchema).safeParse({
      ...qp,
      // Hande boolean/null conversion for filtering if needed
      include_deleted: qp.include_deleted === 'true' ? true : undefined
    });

    if (!queryParams.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(queryParams.error),
      });
    }

    const { page, limit, site_id, include_deleted } = queryParams.data;
    const offset = (page - 1) * limit;

    let query = ctx.supabase
      .from("job_posts")
      // Select specific columns + estimated count for performance
      .select("id, title, slug, created_at, status, location, employment_type, is_active", { count: "estimated" })
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", site_id)
      .range(offset, offset + limit - 1) // Pagination
      .order("created_at", { ascending: false });

    if (!include_deleted) query = query.is("deleted_at", null);

    const { data, error, count } = await query;
    if (error) throw mapPostgrestError(error);

    return jsonOk({
      items: data ?? [],
      meta: {
        total: count ?? 0,
        page,
        limit,
        has_more: (count ?? 0) > (page * limit)
      }
    });

  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);

    // Permission check - require granular hr:job_posts:create permission
    if (!hasPermission(ctx.permissions, 'hr:job_posts:create')) {
      throw new HttpError(403, {
        code: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz yok.',
      });
    }

    const body = await parseJson(req);

    const parsed = createJobPostRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    // Validate site access - ensure the site belongs to the user's tenant (IDOR prevention)
    const { data: siteAccess, error: siteAccessError } = await ctx.supabase
      .from('sites')
      .select('id')
      .eq('id', parsed.data.site_id)
      .eq('tenant_id', ctx.tenant.id)
      .single();

    if (siteAccessError || !siteAccess) {
      throw new HttpError(403, {
        code: 'FORBIDDEN',
        message: 'Bu siteye erişim yetkiniz yok.',
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
        is_active: parsed.data.is_active ?? false, // Default to FALSE (Draft) for safety
      })
      .select("*")
      .single();

    if (error) throw mapPostgrestError(error);
    return jsonOk(jobPostSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}

