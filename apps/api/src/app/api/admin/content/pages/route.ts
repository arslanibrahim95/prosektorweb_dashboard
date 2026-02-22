import {
    HttpError,
    jsonOk,
    mapPostgrestError,
    zodErrorToDetails,
} from "@/server/api/http";
import { buildSafeIlikeOr, safeSearchParamSchema } from "@/server/api/postgrest-search";
import { requireAuthContext } from "@/server/auth/context";
import type { AuthContext } from "@/server/auth/context";
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

interface AdminContentPage {
    id: string;
    title: string;
    slug: string;
    status: "published" | "draft";
    origin?: string | null;
    updated_at: string;
    created_at: string;
}

function buildPagesQuery(
    ctx: AuthContext,
    columns: string,
    offset: number,
    limit: number,
    search?: string,
    status?: "published" | "draft",
    includeDeletedFilter: boolean = true,
) {
    let query = ctx.admin
        .from("pages")
        .select(columns, { count: "exact" })
        .eq("tenant_id", ctx.tenant.id);

    if (includeDeletedFilter) {
        query = query.is("deleted_at", null);
    }

    if (search) {
        query = query.or(buildSafeIlikeOr(["title", "slug"], search));
    }

    if (status === "published") {
        query = query.eq("status", "published");
    } else if (status === "draft") {
        query = query.eq("status", "draft");
    }

    return query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
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

        const primary = await buildPagesQuery(
            ctx,
            "id, title, slug, status, origin, updated_at, created_at",
            offset,
            limit,
            search,
            status,
            true,
        );

        let data = (primary.data ?? []) as unknown as AdminContentPage[];
        let error = primary.error;
        let count = primary.count;

        if (error && isMissingColumnError(error)) {
            const fallback = await buildPagesQuery(
                ctx,
                "id, title, slug, status, updated_at, created_at",
                offset,
                limit,
                search,
                status,
                false,
            );

            data = ((fallback.data ?? []) as unknown as AdminContentPage[]).map((item) => ({
                ...item,
                origin: item.origin ?? "unknown",
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
