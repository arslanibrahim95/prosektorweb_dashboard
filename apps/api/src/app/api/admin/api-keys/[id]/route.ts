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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new HttpError(400, {
            code: "VALIDATION_ERROR",
            message: "Request body must be a JSON object",
        });
    }
    return value as Record<string, unknown>;
}

// PATCH /api/admin/api-keys/[id] - Update API key (toggle active, update name)
async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_api_keys_write", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        const { id } = await params;
        if (!id) {
            throw new HttpError(400, { code: "VALIDATION_ERROR", message: "API key id is required" });
        }
        const parsedBody = await parseJson(req);
        const body = asRecord(parsedBody);

        // Build update object
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (body.name !== undefined) {
            if (typeof body.name !== 'string' || body.name.length < 1 || body.name.length > 255) {
                throw new HttpError(400, { code: "VALIDATION_ERROR", message: "Name must be between 1 and 255 characters" });
            }
            updateData.name = body.name;
        }

        if (body.is_active !== undefined) {
            if (typeof body.is_active !== 'boolean') {
                throw new HttpError(400, { code: "VALIDATION_ERROR", message: "is_active must be a boolean" });
            }
            updateData.is_active = body.is_active;
        }

        if (body.rate_limit !== undefined) {
            const rateLimit = Number(body.rate_limit);
            if (isNaN(rateLimit) || rateLimit < 1 || rateLimit > 10000) {
                throw new HttpError(400, { code: "VALIDATION_ERROR", message: "Rate limit must be between 1 and 10000" });
            }
            updateData.rate_limit = rateLimit;
        }

        // Update API key
        const { data: apiKey, error } = await ctx.admin
            .from('api_keys')
            .update(updateData)
            .eq('id', id)
            .eq('tenant_id', ctx.tenant.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating API key:', error);
            return jsonError({ code: 'UPDATE_ERROR', message: 'Failed to update API key' }, 500);
        }

        if (!apiKey) {
            return jsonError({ code: 'NOT_FOUND', message: 'API key not found' }, 404);
        }

        return jsonOk({
            id: apiKey.id,
            name: apiKey.name,
            key_prefix: apiKey.key_prefix,
            permissions: apiKey.permissions,
            rate_limit: apiKey.rate_limit,
            expires_at: apiKey.expires_at,
            is_active: apiKey.is_active,
            created_at: apiKey.created_at,
            updated_at: apiKey.updated_at,
        });
    } catch (error) {
        console.error('API keys PATCH error:', error);
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status);
        }
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500);
    }
}

// DELETE /api/admin/api-keys/[id] - Delete API key
async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_api_keys_write", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        const { id } = await params;
        if (!id) {
            throw new HttpError(400, { code: "VALIDATION_ERROR", message: "API key id is required" });
        }

        // Delete API key
        const { error } = await ctx.admin
            .from('api_keys')
            .delete()
            .eq('id', id)
            .eq('tenant_id', ctx.tenant.id);

        if (error) {
            console.error('Error deleting API key:', error);
            return jsonError({ code: 'DELETE_ERROR', message: 'Failed to delete API key' }, 500);
        }

        return jsonOk({ message: 'API key deleted successfully' });
    } catch (error) {
        console.error('API keys DELETE error:', error);
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status);
        }
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500);
    }
}

export { PATCH, DELETE };
