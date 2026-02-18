import {
    asErrorBody,
    asHeaders,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { safeSearchParamSchema } from "@/server/api/postgrest-search";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const adminLogsQuerySchema = z
    .object({
        search: safeSearchParamSchema.optional(),
        level: z.string().optional(), // Alias for action
        action: z.string().optional(),
        entity_type: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
    })
    .strict();

export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_logs", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const url = new URL(req.url);

        // Parse query params
        const search = url.searchParams.get("search") || undefined;
        const action = url.searchParams.get("action") || undefined;
        const entityType = url.searchParams.get("entity_type") || undefined;
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
        const dateFrom = url.searchParams.get("date_from") || undefined;
        const dateTo = url.searchParams.get("date_to") || undefined;

        const offset = (page - 1) * limit;

        // Build query
        let query = ctx.admin
            .from("audit_logs")
            .select("*", { count: "exact" })
            .eq("tenant_id", ctx.tenant.id);

        // Apply filters
        if (action) {
            query = query.eq("action", action);
        }

        if (entityType) {
            query = query.eq("entity_type", entityType);
        }

        if (dateFrom) {
            query = query.gte("created_at", dateFrom);
        }

        if (dateTo) {
            query = query.lte("created_at", dateTo);
        }

        if (search) {
            // Search in entity_id (if UUID) or meta (contains info)
            query = query.or(`entity_id.ilike.%${search}%,meta->>'ip'.ilike.%${search}%,meta->>'user_agent'.ilike.%${search}%`);
        }

        // Apply sorting and pagination
        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw mapPostgrestError(error);
        }

        const totalPages = Math.ceil((count ?? 0) / limit);

        return jsonOk({
            data: data ?? [],
            pagination: {
                page,
                limit,
                total: count ?? 0,
                totalPages,
            },
        }, 200, rateLimitHeaders(rateLimit));

    } catch (error) {
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status, error.headers);
        }

        console.error("[admin/logs] Unexpected error:", error);
        const body = asErrorBody(error);
        const status = asStatus(error);
        const headers = asHeaders(error);
        return jsonError(body, status, headers);
    }
}
