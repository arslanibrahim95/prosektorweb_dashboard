/**
 * Generic inbox handler factory
 * Eliminates duplication across inbox API routes by providing a unified implementation
 */

import type { z } from "zod";
import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { calculatePaginationRange } from "@/server/api/pagination";
import { getOrSetCachedValue } from "@/server/cache";
import { requireAuthContext } from "@/server/auth/context";
import { hasPermission } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { INBOX_COUNT_CACHE_TTL_SEC } from "./constants";
import type { BaseInboxQuery } from "./base-schema";
import { parseInboxQueryParams } from "./query-params";
import { applyInboxFilters, getInboxDbClient, type InboxAdditionalFilters } from "./query-utils";

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
    additionalFilters?: InboxAdditionalFilters<TQuery>;

    /**
     * Optional function to build cache key parts for additional filters
     * Should return array of strings to include in cache key
     */
    additionalCacheKeyParts?: (params: TQuery) => string[];

    /**
     * Zod schema for validating and parsing response items
     */
    itemSchema: z.ZodType<Record<string, unknown>>;

    /**
     * Zod schema for validating the complete response
     */
    responseSchema: z.ZodType<{ items: unknown[]; total: number }>;
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

            // 2. Permission check - inbox:read required for all inbox endpoints
            if (!hasPermission(ctx.permissions, 'inbox:read')) {
                throw new HttpError(403, {
                    code: 'FORBIDDEN',
                    message: 'Bu işlem için yetkiniz yok.',
                });
            }

            const env = getServerEnv();
            const url = new URL(req.url);

            // 2. Parse and validate query parameters using centralized parser
            // This preserves strict behavior: unknown params are rejected, not stripped
            const parsed = parseInboxQueryParams(url.searchParams, querySchema);

            // 3. Rate limiting
            const hasSearch = typeof parsed.search === "string";
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
            const { from, to } = calculatePaginationRange(parsed.page, parsed.limit);

            // 5. Build data query with common filters
            const dbClient = getInboxDbClient(ctx);
            const baseDataQuery = dbClient
                .from(tableName)
                .select(selectFields)
                .eq("tenant_id", ctx.tenant.id)
                .eq("site_id", parsed.site_id)
                // Security: orderBy is strictly from server-side config, not user input.
                // This prevents SQL injection via sort parameters.
                .order(orderBy, { ascending: orderDirection === "asc" })
                .range(from, to);

            // 6. Apply common filters (status, date range, search, additional)
            // Type-safe query builder - using explicit type for Supabase compatibility
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dataQuery: any = applyInboxFilters(
                baseDataQuery,
                parsed,
                searchFields,
                additionalFilters,
                ctx
            );

            // 7. Execute data query
            const { data, error } = await dataQuery;
            if (error) throw mapPostgrestError(error);

            // 11. Build cache key for count query
            const cacheKeyParts = [
                "inbox-count",
                cacheKeyPrefix,
                ctx.tenant.id,
                parsed.site_id,
                parsed.status ?? "",
                parsed.date_from ?? "",
                parsed.date_to ?? "",
                parsed.search ?? "",
            ];

            // Add additional cache key parts if provided
            if (additionalCacheKeyParts) {
                cacheKeyParts.push(...additionalCacheKeyParts(parsed));
            }

            const countCacheKey = cacheKeyParts.join("|");

            // 9. Get cached or fetch total count
            const total = await getOrSetCachedValue<number>(
                countCacheKey,
                INBOX_COUNT_CACHE_TTL_SEC,
                async () => {
                    const baseCountQuery = dbClient
                        .from(tableName)
                        .select("id", { count: "exact", head: true })
                        .eq("tenant_id", ctx.tenant.id)
                        .eq("site_id", parsed.site_id);

                    // Apply same filters using shared helper
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const countQuery: any = applyInboxFilters(
                        baseCountQuery,
                        parsed,
                        searchFields,
                        additionalFilters,
                        ctx
                    );

                    const { error: countError, count } = await countQuery;
                    if (countError) throw mapPostgrestError(countError);
                    return count ?? 0;
                }
            );

            // 13. Parse and validate response (safeParse to avoid unhandled throws)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsedItems = (data ?? []).map((item: any) => {
                const result = itemSchema.safeParse(item);
                if (!result.success) {
                    console.error('[Inbox] Item validation failed:', {
                        errors: result.error.issues,
                        itemId: item?.id,
                    });
                    return null;
                }
                return result.data;
            }).filter(Boolean);

            const responseParsed = responseSchema.safeParse({
                items: parsedItems,
                total,
            });

            if (!responseParsed.success) {
                console.error('[Inbox] Response schema validation failed:', {
                    errors: responseParsed.error.issues,
                });
                throw new HttpError(500, {
                    code: 'INTERNAL_ERROR',
                    message: 'Veri formatı beklenenden farklı.',
                });
            }

            const response = responseParsed.data;

            // 14. Return successful response with rate limit headers
            return jsonOk(response, 200, rateLimitHeaders(rateLimit));
        } catch (err) {
            return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
        }
    };
}
