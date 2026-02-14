/**
 * Generic export handler factory for inbox routes
 * Eliminates duplication across inbox export endpoints
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { uuidSchema } from "@prosektor/contracts";
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
import type { AuthContext } from "@/server/auth/context";

/**
 * Base export query schema - can be extended by specific routes
 */
export const baseExportQuerySchema = z
    .object({
        site_id: uuidSchema,
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(2000).default(1000),
        search: safeSearchParamSchema.optional(),
        status: z.enum(["read", "unread"]).optional(),
        date_from: z.string().min(1).optional(),
        date_to: z.string().min(1).optional(),
        format: z.string().optional(), // compat: frontend sets `format=csv`
    })
    .strict();

export type BaseExportQuery = z.infer<typeof baseExportQuerySchema>;

/**
 * Configuration for export handler factory
 */
export interface ExportHandlerConfig<TQuery extends BaseExportQuery = BaseExportQuery> {
    /** Database table name */
    tableName: string;

    /** Comma-separated list of fields to select from the table */
    selectFields: string;

    /** CSV column headers */
    headers: string[];

    /** Maps DB row to CSV row values */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowMapper: (item: any) => (string | number | boolean | null | object)[];

    /** Filename prefix (e.g., 'contact', 'offers', 'applications') */
    filenamePrefix: string;

    /** Array of field names to search with ILIKE */
    searchFields: string[];

    /** Rate limit endpoint name (e.g., "inbox_contact_export") */
    rateLimitEndpoint: string;

    /** Zod schema for query parameter validation */
    querySchema: z.ZodType<TQuery>;

    /** Zod schema for validating response items */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemSchema: z.ZodType<any>;

    /**
     * Optional function to apply additional filters to the query
     * Useful for routes like applications that need job_post_id filtering
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalFilters?: (query: any, params: TQuery, ctx: AuthContext) => any;
}

/**
 * Creates a generic export GET handler with all common logic
 */
export function createExportHandler<TQuery extends BaseExportQuery = BaseExportQuery>(
    config: ExportHandlerConfig<TQuery>
) {
    const {
        tableName,
        selectFields,
        headers,
        rowMapper,
        filenamePrefix,
        searchFields,
        rateLimitEndpoint,
        querySchema,
        itemSchema,
        additionalFilters,
    } = config;

    return async function GET(req: Request) {
        try {
            // 1. Auth check
            const ctx = await requireAuthContext(req);
            const env = getServerEnv();
            const url = new URL(req.url);
            const qp = url.searchParams;

            // 2. Parse and validate query parameters
            // Explicitly pick known parameters to avoid unexpected params
            const parsed = querySchema.safeParse({
                site_id: qp.get("site_id") ?? undefined,
                page: qp.get("page") ?? undefined,
                limit: qp.get("limit") ?? undefined,
                search: qp.get("search") ?? undefined,
                status: qp.get("status") ?? undefined,
                date_from: qp.get("date_from") ?? undefined,
                date_to: qp.get("date_to") ?? undefined,
                format: qp.get("format") ?? undefined,
                // Additional fields for extended schemas (e.g., applications export)
                job_post_id: qp.get("job_post_id") ?? undefined,
            });

            if (!parsed.success) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Validation failed",
                    details: zodErrorToDetails(parsed.error),
                });
            }

            // 3. Rate limiting
            const rateLimit = await enforceRateLimit(
                ctx.admin,
                rateLimitAuthKey(rateLimitEndpoint, ctx.tenant.id, ctx.user.id),
                env.dashboardExportRateLimit,
                env.dashboardExportRateWindowSec,
            );

            // 4. Calculate pagination
            const from = (parsed.data.page - 1) * parsed.data.limit;
            const to = from + parsed.data.limit - 1;

            // 5. Build query
            let query = ctx.supabase
                .from(tableName)
                .select(selectFields)
                .eq("tenant_id", ctx.tenant.id)
                .eq("site_id", parsed.data.site_id)
                .order("created_at", { ascending: false })
                .range(from, to);

            // 6. Apply status filter
            if (parsed.data.status === "read") query = query.eq("is_read", true);
            if (parsed.data.status === "unread") query = query.eq("is_read", false);

            // 7. Apply date range filters
            if (parsed.data.date_from) query = query.gte("created_at", parsed.data.date_from);
            if (parsed.data.date_to) query = query.lte("created_at", parsed.data.date_to);

            // 8. Apply search filter
            if (parsed.data.search) {
                query = query.or(buildSafeIlikeOr(searchFields, parsed.data.search));
            }

            // 9. Apply additional filters (e.g., job_post_id for applications)
            if (additionalFilters) {
                query = additionalFilters(query, parsed.data, ctx);
            }

            // 10. Execute query
            const { data, error } = await query;
            if (error) throw mapPostgrestError(error);

            // 11. Parse and map items
            const items = (data ?? []).map((item) => itemSchema.parse(item));
            const rows = items.map(rowMapper);

            // 12. Generate CSV
            const csv = toCsv(headers, rows);
            const today = new Date().toISOString().slice(0, 10);
            const filename = `${filenamePrefix}_${parsed.data.site_id}_${today}.csv`;

            // 13. Return CSV response
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
    };
}
