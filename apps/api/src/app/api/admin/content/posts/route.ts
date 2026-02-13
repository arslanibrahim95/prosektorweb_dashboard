import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    zodErrorToDetails,
} from "@/server/api/http";
import { buildSafeIlikeOr, safeSearchParamSchema } from "@/server/api/postgrest-search";
import { requireAuthContext } from "@/server/auth/context";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
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

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        // Admin role check
        if (ctx.role !== "owner" && ctx.role !== "admin" && ctx.role !== "super_admin") {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
        }

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_content_posts", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

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
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
