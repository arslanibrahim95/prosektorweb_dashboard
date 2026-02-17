import { NextRequest } from "next/server";
import {
    HttpError,
    parseJson,
    jsonError,
    jsonOk,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceRateLimit, rateLimitAuthKey } from "@/server/rate-limit";
import { getServerEnv } from "@/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;
const MAX_PAGE = 1000000;

function parsePositiveIntParam(
    value: string | null,
    fallback: number,
    max: number,
    field: string
): number {
    if (value === null || value.trim() === "") {
        return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
        throw new HttpError(400, {
            code: "VALIDATION_ERROR",
            message: `${field} must be a positive integer`,
        });
    }

    return Math.min(parsed, max);
}

function asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new HttpError(400, {
            code: "VALIDATION_ERROR",
            message: "Request body must be a JSON object",
        });
    }
    return value as Record<string, unknown>;
}

// GET /api/admin/reports - List all reports for the tenant
async function GET(req: NextRequest) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const env = getServerEnv();
        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_reports", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const { searchParams } = new URL(req.url);
        const page = parsePositiveIntParam(searchParams.get("page"), 1, MAX_PAGE, "page");
        const limit = parsePositiveIntParam(searchParams.get("limit"), 20, MAX_LIMIT, "limit");
        const status = searchParams.get('status');
        const type = searchParams.get('type');
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

        if (error) {
            console.error('Error fetching reports:', error);
            return jsonError({ code: 'FETCH_ERROR', message: 'Failed to fetch reports' }, 500);
        }

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
        if (countError) {
            console.error('Error fetching report count:', countError);
            return jsonError({ code: 'FETCH_ERROR', message: 'Failed to fetch report count' }, 500);
        }

        return jsonOk({
            items: reports || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('Reports GET error:', error);
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status);
        }
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500);
    }
}

// POST /api/admin/reports - Create a new report
async function POST(req: NextRequest) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_reports_write", ctx.tenant.id, ctx.user.id),
            5,
            300,
        );

        const parsedBody = await parseJson(req);
        const body = asRecord(parsedBody);
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const type = typeof body.type === "string" ? body.type : "";

        // Validate required fields
        if (!name || !type) {
            return jsonError({ code: 'VALIDATION_ERROR', message: 'Name and type are required' }, 400);
        }
        if (name.length > 255) {
            return jsonError({ code: 'VALIDATION_ERROR', message: 'Name must be at most 255 characters' }, 400);
        }

        const validTypes = ['users', 'content', 'analytics', 'revenue', 'custom'];
        const validFormats = ['csv', 'xlsx', 'pdf'];

        if (!validTypes.includes(type)) {
            return jsonError({ code: 'VALIDATION_ERROR', message: 'Invalid report type' }, 400);
        }

        const requestedFormat = typeof body.format === "string" ? body.format : "";
        const format = validFormats.includes(requestedFormat) ? requestedFormat : 'csv';
        const parameters =
            typeof body.parameters === "object" &&
            body.parameters !== null &&
            !Array.isArray(body.parameters)
                ? body.parameters
                : {};

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

        if (error) {
            console.error('Error creating report:', error);
            return jsonError({ code: 'CREATE_ERROR', message: 'Failed to create report' }, 500);
        }

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
            console.error('Error updating report:', updateError);
        }

        return jsonOk({
            ...(updatedReport || report),
            message: 'Rapor oluşturuldu.',
        }, 201);
    } catch (error) {
        console.error('Reports POST error:', error);
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status);
        }
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500);
    }
}

// DELETE /api/admin/reports?id=<uuid> - Delete a report
async function DELETE(req: NextRequest) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_reports_write", ctx.tenant.id, ctx.user.id),
            5,
            300,
        );

        const { searchParams } = new URL(req.url);
        const reportId = searchParams.get('id');

        if (!reportId) {
            return jsonError({ code: 'VALIDATION_ERROR', message: 'Report id is required' }, 400);
        }

        // Verify report belongs to this tenant
        const { data: existing } = await ctx.admin
            .from('reports')
            .select('id, name')
            .eq('id', reportId)
            .eq('tenant_id', ctx.tenant.id)
            .maybeSingle();

        if (!existing) {
            return jsonError({ code: 'NOT_FOUND', message: 'Report not found' }, 404);
        }

        const { error } = await ctx.admin
            .from('reports')
            .delete()
            .eq('id', reportId)
            .eq('tenant_id', ctx.tenant.id);

        if (error) {
            console.error('Error deleting report:', error);
            return jsonError({ code: 'DELETE_ERROR', message: 'Failed to delete report' }, 500);
        }

        return jsonOk({ success: true, id: reportId });
    } catch (error) {
        console.error('Reports DELETE error:', error);
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status);
        }
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500);
    }
}

export { GET, POST, DELETE };
