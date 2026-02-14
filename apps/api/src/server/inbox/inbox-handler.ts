/**
 * Generic inbox handler factory
 * Eliminates duplication across inbox API routes by providing a unified implementation
 */

import type { z } from "zod";
import type { AuthContext } from "@/server/auth/context";
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
import { buildSafeIlikeOr } from "@/server/api/postgrest-search";
import { calculatePaginationRange } from "@/server/api/pagination";
import { getOrSetCachedValue } from "@/server/cache";
import { requireAuthContext } from "@/server/auth/context";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { INBOX_COUNT_CACHE_TTL_SEC } from "./constants";
import type { BaseInboxQuery } from "./base-schema";

/**
 * Configuration for inbox handler factory
 */
export interface InboxHandlerConfig<TQuery extends BaseInboxQuery = BaseInboxQuery> {
    /** Database table name */
    tableName: string;

    /** Zod schema for query parameter validation */
    querySchema: z.ZodType<TQuery>;

    /** Comma-separated list of fields to select from the table */
    selectFields: string;

    /** Array of field names to search with ILIKE */
    searchFields: string[];

    /** Rate limit endpoint name (e.g., "inbox_contact") */
    rateLimitEndpoint: string;

    /** Default order by field (default: "created_at") */
    orderBy?: string;

    /** Default order direction (default: "desc") */
    orderDirection?: "asc" | "desc";

    /** Cache key prefix for count queries (e.g., "contact", "offers") */
    cacheKeyPrefix: string;

    /**
     * Optional function to apply additional filters to the query
     * Useful for routes like hr-applications that need job_post_id filtering
     */
    additionalFilters?: (query: any, params: TQuery, ctx: AuthContext) => any;

    /**
     * Optional function to build cache key parts for additional filters
     * Should return array of strings to include in cache key
     */
    additionalCacheKeyParts?: (params: TQuery) => string[];

    /**
     * Zod schema for validating and parsing response items
     */
    itemSchema: z.ZodType<any>;

    /**
     * Zod schema for validating the complete response
     */
    responseSchema: z.ZodType<any>;
}

/**
 * Creates a generic inbox GET handler with all common logic
 */
export function createInboxHandler<TQuery extends BaseInboxQuery = BaseInboxQuery>(
    config: InboxHandlerConfig<TQuery>
) {
    const {
        tableName,
        querySchema,
        selectFields,
        searchFields,
        rateLimitEndpoint,
        orderBy = "created_at",
        orderDirection = "desc",
        cacheKeyPrefix,
        additionalFilters,
        additionalCacheKeyParts,
        itemSchema,
        responseSchema,
    } = config;

    return async function GET(req: Request) {
        try {
            // 1. Auth check
            const ctx = await requireAuthContext(req);
            const env = getServerEnv();
            const url = new URL(req.url);
            const qp = url.searchParams;

            // 2. Parse and validate query parameters
            const parsed = querySchema.safeParse({
                site_id: qp.get("site_id"),
                page: qp.get("page") ?? undefined,
                limit: qp.get("limit") ?? undefined,
                search: qp.get("search") ?? undefined,
                status: qp.get("status") ?? undefined,
                date_from: qp.get("date_from") ?? undefined,
                date_to: qp.get("date_to") ?? undefined,
                // Additional fields will be picked up by extended schemas
                ...(Object.fromEntries(qp.entries())),
            });

            if (!parsed.success) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Validation failed",
                    details: zodErrorToDetails(parsed.error),
                });
            }

            // 3. Rate limiting
            const hasSearch = typeof parsed.data.search === "string";
            const rateLimit = await enforceRateLimit(
                ctx.admin,
                rateLimitAuthKey(
                    hasSearch ? `${rateLimitEndpoint}_search` : `${rateLimitEndpoint}_list`,
                    ctx.tenant.id,
                    ctx.user.id,
                ),
                hasSearch ? env.dashboardSearchRateLimit : env.dashboardReadRateLimit,
                hasSearch ? env.dashboardSearchRateWindowSec : env.dashboardReadRateWindowSec,
            );

            // 4. Calculate pagination
            const { from, to } = calculatePaginationRange(parsed.data.page, parsed.data.limit);

            // 5. Build data query
            let dataQuery = ctx.supabase
                .from(tableName)
                .select(selectFields)
                .eq("tenant_id", ctx.tenant.id)
                .eq("site_id", parsed.data.site_id)
                .order(orderBy, { ascending: orderDirection === "asc" })
                .range(from, to);

            // 6. Apply status filter
            if (parsed.data.status === "read") dataQuery = dataQuery.eq("is_read", true);
            if (parsed.data.status === "unread") dataQuery = dataQuery.eq("is_read", false);

            // 7. Apply date range filters
            if (parsed.data.date_from) dataQuery = dataQuery.gte("created_at", parsed.data.date_from);
            if (parsed.data.date_to) dataQuery = dataQuery.lte("created_at", parsed.data.date_to);

            // 8. Apply search filter
            if (parsed.data.search) {
                dataQuery = dataQuery.or(buildSafeIlikeOr(searchFields, parsed.data.search));
            }

            // 9. Apply additional filters (e.g., job_post_id for hr-applications)
            if (additionalFilters) {
                dataQuery = additionalFilters(dataQuery, parsed.data, ctx);
            }

            // 10. Execute data query
            const { data, error } = await dataQuery;
            if (error) {
                throw mapPostgrestError(error);
            }

            // 11. Build cache key for count query
            const cacheKeyParts = [
                "inbox-count",
                cacheKeyPrefix,
                ctx.tenant.id,
                parsed.data.site_id,
                parsed.data.status ?? "",
                parsed.data.date_from ?? "",
                parsed.data.date_to ?? "",
                parsed.data.search ?? "",
            ];

            // Add additional cache key parts if provided
            if (additionalCacheKeyParts) {
                cacheKeyParts.push(...additionalCacheKeyParts(parsed.data));
            }

            const countCacheKey = cacheKeyParts.join("|");

            // 12. Get cached or fetch total count
            const total = await getOrSetCachedValue<number>(
                countCacheKey,
                INBOX_COUNT_CACHE_TTL_SEC,
                async () => {
                    let countQuery = ctx.supabase
                        .from(tableName)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .eq("site_id", parsed.data.site_id);

                    // Apply same filters to count query
                    if (parsed.data.status === "read") countQuery = countQuery.eq("is_read", true);
                    if (parsed.data.status === "unread") countQuery = countQuery.eq("is_read", false);
                    if (parsed.data.date_from) countQuery = countQuery.gte("created_at", parsed.data.date_from);
                    if (parsed.data.date_to) countQuery = countQuery.lte("created_at", parsed.data.date_to);
                    if (parsed.data.search) {
                        countQuery = countQuery.or(buildSafeIlikeOr(searchFields, parsed.data.search));
                    }

                    // Apply additional filters to count query
                    if (additionalFilters) {
                        countQuery = additionalFilters(countQuery, parsed.data, ctx);
                    }

                    const { error: countError, count } = await countQuery;
                    if (countError) {
                        throw mapPostgrestError(countError);
                    }
                    return count ?? 0;
                }
            );

            // 13. Parse and validate response
            const response = responseSchema.parse({
                items: (data ?? []).map((item) => itemSchema.parse(item)),
                total,
            });

            // 14. Return successful response with rate limit headers
            return jsonOk(response, 200, rateLimitHeaders(rateLimit));
        } catch (err) {
            return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
        }
    };
}
