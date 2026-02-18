import {
    HttpError,
    jsonOk,
    mapPostgrestError,
    zodErrorToDetails,
} from "@/server/api/http";
import { safeSearchParamSchema } from "@/server/api/postgrest-search";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";
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

export const GET = withAdminErrorHandling(async (req: Request) => {
    const ctx = await requireAuthContext(req);

    assertAdminRole(ctx.role);

    const rateLimit = await enforceAdminRateLimit(ctx, "admin_logs", "read");

    const url = new URL(req.url);

    // Validate query params through Zod schema (prevents PostgREST injection)
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = adminLogsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
        throw new HttpError(400, {
            code: "VALIDATION_ERROR",
            message: "Geçersiz sorgu parametreleri",
            details: zodErrorToDetails(parsed.error),
        });
    }

    const {
        search,
        action,
        level,
        entity_type: entityType,
        page,
        limit,
        date_from: dateFrom,
        date_to: dateTo,
    } = parsed.data;

    // Use level as alias for action if action is not provided
    const effectiveAction = action ?? level;

    const offset = (page - 1) * limit;

    // Build query
    let query = ctx.admin
        .from("audit_logs")
        .select("*", { count: "exact" })
        .eq("tenant_id", ctx.tenant.id);

    // Apply filters
    if (effectiveAction) {
        query = query.eq("action", effectiveAction);
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
        // Search is already sanitized via safeSearchParamSchema
        query = query.or(`entity_id.ilike.%${search}%,meta->>'ip'.ilike.%${search}%,meta->>'user_agent'.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw mapPostgrestError(error);
    }

    const items = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);
    const byAction = items.reduce<Record<string, number>>((acc, item) => {
        const actionKey = typeof item.action === "string" ? item.action : "unknown";
        acc[actionKey] = (acc[actionKey] ?? 0) + 1;
        return acc;
    }, {});

    return jsonOk({
        // Preferred shape for admin web UI
        items,
        total,
        page,
        limit,
        stats: {
            total,
            byAction,
        },
        // Backward-compatible shape for existing consumers
        data: items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    }, 200, rateLimitHeaders(rateLimit));
});
