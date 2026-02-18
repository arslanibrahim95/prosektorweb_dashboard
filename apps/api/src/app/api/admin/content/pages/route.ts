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

export const adminContentPagesQuerySchema = z
    .object({
        search: safeSearchParamSchema.optional(),
        status: z.enum(["published", "draft"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict();

interface MissingColumnError {
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
}

function isMissingColumnError(error: MissingColumnError): boolean {
    if (!error.code) return false;
    return error.code === "42703" || error.code === "PGRST204";
}

export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_content_pages", "read");

        const url = new URL(req.url);
        const parsedQuery = adminContentPagesQuerySchema.safeParse({
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

        const applyCommonFilters = (query: any) => {
            if (search) {
                query = query.or(buildSafeIlikeOr(["title", "slug"], search));
            }

            if (status === "published") {
                query = query.eq("status", "published");
            } else if (status === "draft") {
                query = query.eq("status", "draft");
            }

            return query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
        };

        const primary = await applyCommonFilters(
            ctx.admin
                .from("pages")
                .select("id, title, slug, status, origin, updated_at, created_at", { count: "exact" })
                .eq("tenant_id", ctx.tenant.id)
                .is("deleted_at", null),
        );

        let data = (primary.data as Array<Record<string, unknown>> | null) ?? [];
        let error = primary.error;
        let count = primary.count;

        if (error && isMissingColumnError(error)) {
            const fallback = await applyCommonFilters(
                ctx.admin
                    .from("pages")
                    .select("id, title, slug, status, updated_at, created_at", { count: "exact" })
                    .eq("tenant_id", ctx.tenant.id),
            );

            data = ((fallback.data as Array<Record<string, unknown>> | null) ?? []).map((item) => ({
                ...item,
                origin: "unknown",
            }));
            error = fallback.error;
            count = fallback.count;
        }

        if (error) throw mapPostgrestError(error);

        return jsonOk(
            {
                items: data,
                total: count ?? 0,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
});
