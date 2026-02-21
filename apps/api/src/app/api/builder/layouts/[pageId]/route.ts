import { publishBuilderLayoutResponseSchema, updateBuilderLayoutRequestSchema } from "@prosektor/contracts";
import {
    asHeaders,
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
import { assertPageEditableByPanelRole, getPageOriginForTenant } from "@/server/pages/origin-guard";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { getServerEnv } from "@/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUILDER_LAYOUT_WRITE_LIMIT = 240;
const BUILDER_LAYOUT_WRITE_WINDOW_SECONDS = 60;
const BUILDER_LAYOUT_PUBLISH_LIMIT = 30;
const BUILDER_LAYOUT_PUBLISH_WINDOW_SECONDS = 3600;

interface RouteParams {
    params: Promise<{ pageId: string }>;
}

/**
 * GET /api/builder/layouts/{pageId}
 * 
 * Fetch page layout data for the builder
 */
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();
        const { pageId } = await params;

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("builder_layouts", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        // Get page info
        const { data: page, error: pageError } = await ctx.supabase
            .from('pages')
            .select('id, tenant_id, site_id, slug, title, origin')
            .eq('id', pageId)
            .eq('tenant_id', ctx.tenant.id)
            .single();

        if (pageError || !page) {
            throw new HttpError(404, { code: "NOT_FOUND", message: "Sayfa bulunamadı" });
        }

        // Get layout
        const { data: layout, error: layoutError } = await ctx.supabase
            .from('page_layouts')
            .select('*')
            .eq('page_id', pageId)
            .eq('tenant_id', ctx.tenant.id)
            .single();

        if (layoutError && layoutError.code !== 'PGRST116') {
            throw mapPostgrestError(layoutError);
        }

        // Get history
        const { data: history } = await ctx.supabase
            .from('layout_history')
            .select('id, action, description, version, created_at')
            .eq('page_layout_id', layout?.id)
            .order('created_at', { ascending: false })
            .limit(20);

        return jsonOk({
            page,
            layout: layout || null,
            history: history || [],
        }, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

/**
 * PUT /api/builder/layouts/{pageId}
 * 
 * Save/update page layout data
 */
export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const ctx = await requireAuthContext(req);
        const { pageId } = await params;
        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("builder_layouts_write", ctx.tenant.id, ctx.user.id),
            BUILDER_LAYOUT_WRITE_LIMIT,
            BUILDER_LAYOUT_WRITE_WINDOW_SECONDS,
        );
        const parsedBody = updateBuilderLayoutRequestSchema.safeParse(await parseJson(req));
        if (!parsedBody.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedBody.error),
            });
        }
        const body = parsedBody.data;

        const page = await getPageOriginForTenant(ctx, pageId);
        assertPageEditableByPanelRole(page.origin, ctx.role);

        const layout_data = body.layout_data;
        const preview_data = body.preview_data;

        // Check if layout exists
        const { data: existingLayout } = await ctx.supabase
            .from('page_layouts')
            .select('id, version')
            .eq('page_id', pageId)
            .eq('tenant_id', ctx.tenant.id)
            .single();

        let layout;

        if (existingLayout) {
            // Update existing layout
            const newVersion = existingLayout.version + 1;

            // Save to history before updating
            await ctx.supabase.from('layout_history').insert({
                tenant_id: ctx.tenant.id,
                page_layout_id: existingLayout.id,
                layout_data: body.previous_layout_data || {},
                action: 'update',
                description: 'Düzenleme',
                version: existingLayout.version,
            });

            const { data, error } = await ctx.supabase
                .from('page_layouts')
                .update({
                    layout_data: layout_data || {},
                    preview_data: preview_data || null,
                    version: newVersion,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingLayout.id)
                .select()
                .single();

            if (error) throw mapPostgrestError(error);
            layout = data;
        } else {
            // Create new layout
            const { data, error } = await ctx.supabase
                .from('page_layouts')
                .insert({
                    tenant_id: ctx.tenant.id,
                    page_id: pageId,
                    layout_data: layout_data || {},
                    preview_data: preview_data || null,
                    version: 1,
                })
                .select()
                .single();

            if (error) throw mapPostgrestError(error);
            layout = data;
        }

        return jsonOk(layout, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

/**
 * POST /api/builder/layouts/{pageId}/publish
 * 
 * Publish the current layout
 */
export async function POST(req: Request, { params }: RouteParams) {
    try {
        const ctx = await requireAuthContext(req);
        const { pageId } = await params;
        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("builder_layouts_publish", ctx.tenant.id, ctx.user.id),
            BUILDER_LAYOUT_PUBLISH_LIMIT,
            BUILDER_LAYOUT_PUBLISH_WINDOW_SECONDS,
        );

        const page = await getPageOriginForTenant(ctx, pageId);
        assertPageEditableByPanelRole(page.origin, ctx.role);

        // Get current layout
        const { data: layout, error: layoutError } = await ctx.supabase
            .from('page_layouts')
            .select('*')
            .eq('page_id', pageId)
            .eq('tenant_id', ctx.tenant.id)
            .single();

        if (layoutError || !layout) {
            throw new HttpError(404, { code: "NOT_FOUND", message: "Düzen bulunamadı" });
        }

        // Create revision from layout
        const { data: revision, error: revisionError } = await ctx.supabase
            .from('page_revisions')
            .insert({
                tenant_id: ctx.tenant.id,
                page_id: pageId,
                meta: layout.layout_data,
            })
            .select()
            .single();

        if (revisionError) throw mapPostgrestError(revisionError);

        // Update page with published revision
        const { error: updateError } = await ctx.supabase
            .from('pages')
            .update({
                published_revision_id: revision.id,
                status: 'published',
            })
            .eq('id', pageId)
            .eq('tenant_id', ctx.tenant.id);

        if (updateError) throw mapPostgrestError(updateError);

        // Update layout published status
        await ctx.supabase
            .from('page_layouts')
            .update({
                is_published: true,
                published_at: new Date().toISOString(),
            })
            .eq('id', layout.id);

        return jsonOk(
            publishBuilderLayoutResponseSchema.parse({ success: true, revision_id: revision.id }),
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
