import {
    HttpError,
    jsonOk,
    mapPostgrestError,
    zodErrorToDetails,
} from "@/server/api/http";
import { buildSafeIlikeOr, safeSearchParamSchema } from "@/server/api/postgrest-search";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const adminContentPostsQuerySchema = z
    .object({
        search: safeSearchParamSchema.optional(),
        status: z.enum(["active", "inactive"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict();

export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_content_posts", "read");

        const url = new URL(req.url);
        const parsedQuery = adminContentPostsQuerySchema.safeParse({
            search: url.searchParams.get("search") ?? undefined,
            status: url.searchParams.get("status") ?? undefined,
            page: url.searchParams.get("page") ?? undefined,
            limit: url.searchParams.get("limit") ?? undefined,
        });
        if (!parsedQuery.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedQuery.error),
            });
        }

        const { search, status, page, limit } = parsedQuery.data;
        const offset = (page - 1) * limit;

        // Build query
        let query = ctx.admin
            .from("job_posts")
            .select("*", { count: "exact" })
            .eq("tenant_id", ctx.tenant.id)
            .is("deleted_at", null);

        if (search) {
            query = query.or(buildSafeIlikeOr(["title", "slug"], search));
        }

        if (status === "active") {
            query = query.eq("is_active", true);
        } else if (status === "inactive") {
            query = query.eq("is_active", false);
        }

        query = query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw mapPostgrestError(error);

        return jsonOk(
            {
                items: data ?? [],
                total: count ?? 0,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
});
