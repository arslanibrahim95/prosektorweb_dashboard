import {
    createAdminReportRequestSchema,
    createAdminReportResponseSchema,
    deleteAdminReportQuerySchema,
    deleteAdminReportResponseSchema,
    listAdminReportsQuerySchema,
    listAdminReportsResponseSchema,
} from "@prosektor/contracts";
import {
    asErrorBody,
    asHeaders,
    asStatus,
    HttpError,
    mapPostgrestError,
    parseJson,
    jsonError,
    jsonOk,
    zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/reports - List all reports for the tenant
async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_reports", "read");

        const { searchParams } = new URL(req.url);
        const parsedQuery = listAdminReportsQuerySchema.safeParse({
            page: searchParams.get("page") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            type: searchParams.get("type") ?? undefined,
        });
        if (!parsedQuery.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedQuery.error),
            });
        }
        const { page, limit, status, type } = parsedQuery.data;
        const offset = (page - 1) * limit;
        if (!Number.isSafeInteger(offset)) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Pagination values are out of range",
            });
        }

        // Build query
        let query = ctx.admin
            .from('reports')
            .select(`
                *
            `)
            .eq('tenant_id', ctx.tenant.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data: reports, error } = await query;

        if (error) throw mapPostgrestError(error);

        // Get total count
        let countQuery = ctx.admin
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', ctx.tenant.id);

        if (status) {
            countQuery = countQuery.eq('status', status);
        }
        if (type) {
            countQuery = countQuery.eq('type', type);
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw mapPostgrestError(countError);

        const response = listAdminReportsResponseSchema.parse({
            items: reports || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });

        return jsonOk(response, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

// POST /api/admin/reports - Create a new report
async function POST(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_reports", "write");

        const parsedBody = createAdminReportRequestSchema.safeParse(await parseJson(req));
        if (!parsedBody.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedBody.error),
            });
        }
        const {
            name,
            type,
            format,
            parameters,
        } = parsedBody.data;

        // Create report record
        const { data: report, error } = await ctx.admin
            .from('reports')
            .insert({
                tenant_id: ctx.tenant.id,
                name,
                type,
                format: format,
                parameters,
                status: 'pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                created_by: ctx.user.id,
            })
            .select()
            .single();

        if (error) throw mapPostgrestError(error);

        // Simulate completed report immediately (in production, use a job queue)
        const fileSizeKB = Math.floor(Math.random() * 4900) + 100; // 100-5000 KB
        const { data: updatedReport, error: updateError } = await ctx.admin
            .from('reports')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                file_size: fileSizeKB * 1024,
                file_url: `/api/admin/reports/download?id=${report.id}`,
            })
            .eq('id', report.id)
            .select()
            .single();

        if (updateError) {
            logger.error('[admin/reports] report update failed', {
                error: updateError,
                reportId: report.id,
            });
        }

        const response = createAdminReportResponseSchema.parse({
            ...(updatedReport || report),
            message: 'Rapor oluşturuldu.',
        });

        return jsonOk(response, 201, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

// DELETE /api/admin/reports?id=<uuid> - Delete a report
async function DELETE(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_reports", "write");

        const { searchParams } = new URL(req.url);
        const parsedQuery = deleteAdminReportQuerySchema.safeParse({
            id: searchParams.get("id") ?? undefined,
        });
        if (!parsedQuery.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedQuery.error),
            });
        }
        const { id: reportId } = parsedQuery.data;

        // Verify report belongs to this tenant
        const { data: existing } = await ctx.admin
            .from('reports')
            .select('id, name')
            .eq('id', reportId)
            .eq('tenant_id', ctx.tenant.id)
            .maybeSingle();

        if (!existing) {
            throw new HttpError(404, { code: "NOT_FOUND", message: "Report not found" });
        }

        const { error } = await ctx.admin
            .from('reports')
            .delete()
            .eq('id', reportId)
            .eq('tenant_id', ctx.tenant.id);

        if (error) throw mapPostgrestError(error);

        const response = deleteAdminReportResponseSchema.parse({ success: true, id: reportId });
        return jsonOk(response, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

export { GET, POST, DELETE };
