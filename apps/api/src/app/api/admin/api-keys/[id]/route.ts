import {
    adminApiKeySchema,
    deleteAdminApiKeyResponseSchema,
    updateAdminApiKeyRequestSchema,
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/api-keys/[id] - Update API key (toggle active, update name)
async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_api_keys", "write");

        const { id } = await params;
        if (!id) {
            throw new HttpError(400, { code: "VALIDATION_ERROR", message: "API key id is required" });
        }
        const parsedBody = updateAdminApiKeyRequestSchema.safeParse(await parseJson(req));
        if (!parsedBody.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedBody.error),
            });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        const { name, is_active, rate_limit } = parsedBody.data;
        if (name !== undefined) updateData.name = name;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (rate_limit !== undefined) updateData.rate_limit = rate_limit;

        // Update API key
        const { data: apiKey, error } = await ctx.admin
            .from('api_keys')
            .update(updateData)
            .eq('id', id)
            .eq('tenant_id', ctx.tenant.id)
            .select()
            .single();

        if (error) throw mapPostgrestError(error);

        if (!apiKey) {
            throw new HttpError(404, { code: "NOT_FOUND", message: "API key not found" });
        }

        const response = adminApiKeySchema.parse({
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

        return jsonOk(response, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

// DELETE /api/admin/api-keys/[id] - Delete API key
async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_api_keys", "write");

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

        if (error) throw mapPostgrestError(error);

        const response = deleteAdminApiKeyResponseSchema.parse({ message: "API key deleted successfully" });
        return jsonOk(response, 200, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

export { PATCH, DELETE };
