import { NextRequest } from "next/server";
import {
    HttpError,
    jsonError,
    jsonOk,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { isAdminRole } from "@/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/reports - List all reports for the tenant
async function GET(req: NextRequest) {
    try {
        const ctx = await requireAuthContext(req);

        if (!isAdminRole(ctx.role)) {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Admin yetkisi gerekli" });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const offset = (page - 1) * limit;

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

        const { count } = await countQuery;

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

        if (!isAdminRole(ctx.role)) {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Admin yetkisi gerekli" });
        }

        const body = await req.json();

        // Validate required fields
        if (!body.name || !body.type) {
            return jsonError({ code: 'VALIDATION_ERROR', message: 'Name and type are required' }, 400);
        }

        const validTypes = ['users', 'content', 'analytics', 'revenue', 'custom'];
        const validFormats = ['csv', 'xlsx', 'pdf'];

        if (!validTypes.includes(body.type)) {
            return jsonError({ code: 'VALIDATION_ERROR', message: 'Invalid report type' }, 400);
        }

        const format = validFormats.includes(body.format) ? body.format : 'csv';

        // Create report record
        const { data: report, error } = await ctx.admin
            .from('reports')
            .insert({
                tenant_id: ctx.tenant.id,
                name: body.name,
                type: body.type,
                format: format,
                parameters: body.parameters || {},
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

        if (!isAdminRole(ctx.role)) {
            throw new HttpError(403, { code: "FORBIDDEN", message: "Admin yetkisi gerekli" });
        }

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
