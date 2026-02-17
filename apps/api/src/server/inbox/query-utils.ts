import type { AuthContext } from "@/server/auth/context";
import { buildSafeIlikeOr } from "@/server/api/postgrest-search";

/**
 * Common query params used by inbox list/export filters.
 */
export interface InboxFilterParams {
    status?: "read" | "unread";
    date_from?: string;
    date_to?: string;
    search?: string;
}

// Note: 'any' is used here because Supabase PostgREST query builder types are complex
// recursive generics that are difficult to type explicitly in a reusable function.
// The query object is trusted (originates from our own client) and safely handled.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InboxAdditionalFilters<TQuery extends InboxFilterParams> = (query: any, params: TQuery, ctx: AuthContext) => any;

/**
 * Selects the correct Supabase client for inbox operations.
 * super_admin uses admin client to bypass RLS; others use scoped client.
 */
export function getInboxDbClient(ctx: AuthContext) {
    return ctx.role === "super_admin" ? ctx.admin : ctx.supabase;
}

/**
 * Applies common inbox filters to list/export/count queries.
 * Returns the query in the same builder stage as received.
 */
export function applyInboxFilters<TQuery extends InboxFilterParams>(
    query: unknown,
    params: TQuery,
    searchFields: string[],
    additionalFilters?: InboxAdditionalFilters<TQuery>,
    ctx?: AuthContext,
): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = query;

    if (params.status === "read") q = q.eq("is_read", true);
    if (params.status === "unread") q = q.eq("is_read", false);
    if (params.date_from) q = q.gte("created_at", params.date_from);
    if (params.date_to) q = q.lte("created_at", params.date_to);
    if (params.search) q = q.or(buildSafeIlikeOr(searchFields, params.search));
    if (additionalFilters && ctx) q = additionalFilters(q, params, ctx);

    return q;
}
