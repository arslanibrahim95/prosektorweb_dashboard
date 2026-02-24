import {
    builderComponentSchema,
    createBuilderComponentRequestSchema,
    listBuilderComponentsQuerySchema,
    listBuilderComponentsResponseSchema,
} from "@prosektor/contracts";
import {
    asErrorBody,
    asHeaders,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    parseJson,
    zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/builder/components
 * 
 * Fetch available components from the component library
 * 
 * Query params:
 * - category: Filter by category (hero, content, form, navigation, layout, media, custom)
 * - search: Search in name
 */
export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        await enforceAuthRouteRateLimit(ctx, req);
        const { searchParams } = new URL(req.url);
        const parsedQuery = listBuilderComponentsQuerySchema.safeParse({
            category: searchParams.get("category") ?? undefined,
            search: searchParams.get("search") ?? undefined,
        });
        if (!parsedQuery.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedQuery.error),
            });
        }

        const { category, search } = parsedQuery.data;

        let query = ctx.supabase
            .from('component_library')
            .select('id, name, category, component_type, schema, default_props, thumbnail_url, icon, is_system, is_active')
            .eq('tenant_id', ctx.tenant.id)
            .eq('is_active', true);

        if (category) {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data, error } = await query.order('name');

        if (error) {
            throw mapPostgrestError(error);
        }

        const response = listBuilderComponentsResponseSchema.parse({
            items: (data ?? []).map((item) => builderComponentSchema.parse(item)),
            total: data?.length ?? 0,
        });
        return jsonOk(response);
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

/**
 * POST /api/builder/components
 * 
 * Create a new custom component
 */
export async function POST(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        await enforceAuthRouteRateLimit(ctx, req);
        const body = await parseJson(req);
        const parsedBody = createBuilderComponentRequestSchema.safeParse(body);
        if (!parsedBody.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedBody.error),
            });
        }

        const { name, category, component_type, schema, default_props, thumbnail_url, icon } = parsedBody.data;

        const { data, error } = await ctx.supabase
            .from('component_library')
            .insert({
                tenant_id: ctx.tenant.id,
                name,
                category,
                component_type,
                schema: schema || {},
                default_props: default_props || {},
                thumbnail_url: thumbnail_url ?? null,
                icon: icon ?? null,
                is_system: false,
            })
            .select()
            .single();

        if (error) {
            throw mapPostgrestError(error);
        }

        return jsonOk(builderComponentSchema.parse(data));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
