import { NextResponse } from 'next/server';
import {
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    parseJson,
    zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

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
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') || undefined;
        const search = searchParams.get('search') || undefined;

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

        return jsonOk({
            items: data || [],
            total: data?.length || 0,
        });
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err));
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
        const body = await parseJson(req) as Record<string, unknown>;

        // Validate request
        const name = body.name as string | undefined;
        const category = body.category as string | undefined;
        const component_type = body.component_type as string | undefined;
        const schema = body.schema as Record<string, unknown> | undefined;
        const default_props = body.default_props as Record<string, unknown> | undefined;

        if (!name || !category || !component_type) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "name, category ve component_type zorunludur",
            });
        }

        const { data, error } = await ctx.supabase
            .from('component_library')
            .insert({
                tenant_id: ctx.tenant.id,
                name,
                category,
                component_type,
                schema: schema || {},
                default_props: default_props || {},
                is_system: false,
            })
            .select()
            .single();

        if (error) {
            throw mapPostgrestError(error);
        }

        return jsonOk(data);
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err));
    }
}
