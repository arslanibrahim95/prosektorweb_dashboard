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

/**
 * Minimal chainable interface needed by inbox filters.
 * Supabase PostgREST builders satisfy this shape structurally.
 */
export interface InboxFilterBuilder<TSelf> {
    eq(column: string, value: unknown): TSelf;
    gte(column: string, value: string): TSelf;
    lte(column: string, value: string): TSelf;
    or(filters: string): TSelf;
}

/**
 * Additional per-route filter hook that preserves the builder type.
 */
export type InboxAdditionalFilters<TQuery extends InboxFilterParams> = <
    TBuilder extends InboxFilterBuilder<TBuilder>,
>(
    query: TBuilder,
    params: TQuery,
    ctx: AuthContext,
) => TBuilder;

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
export function applyInboxFilters<
    TQuery extends InboxFilterParams,
    TBuilder extends InboxFilterBuilder<TBuilder>,
>(
    query: TBuilder,
    params: TQuery,
    searchFields: string[],
    additionalFilters?: InboxAdditionalFilters<TQuery>,
    ctx?: AuthContext,
): TBuilder {
    let q = query;

    if (params.status === "read") q = q.eq("is_read", true);
    if (params.status === "unread") q = q.eq("is_read", false);
    if (params.date_from) q = q.gte("created_at", params.date_from);
    if (params.date_to) q = q.lte("created_at", params.date_to);
    if (params.search) q = q.or(buildSafeIlikeOr(searchFields, params.search));
    if (additionalFilters && ctx) q = additionalFilters(q, params, ctx);

    return q;
}
