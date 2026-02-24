import {
    createAdminApiKeyRequestSchema,
    createAdminApiKeyResponseSchema,
    listAdminApiKeysQuerySchema,
    listAdminApiKeysResponseSchema,
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

// GET /api/admin/api-keys - List all API keys for the tenant
async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_api_keys", "read");

        const { searchParams } = new URL(req.url);
        const parsedQuery = listAdminApiKeysQuerySchema.safeParse({
            page: searchParams.get("page") ?? undefined,
            limit: searchParams.get("limit") ?? undefined,
        });
        if (!parsedQuery.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedQuery.error),
            });
        }
        const { page, limit } = parsedQuery.data;
        const offset = (page - 1) * limit;
        if (!Number.isSafeInteger(offset)) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Pagination values are out of range",
            });
        }

        // Get API keys (use service role to bypass RLS)
        const { data: apiKeys, error } = await ctx.admin
            .from('api_keys')
            .select(`
                *
            `)
            .eq('tenant_id', ctx.tenant.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw mapPostgrestError(error);

        // Get total count
        const { count, error: countError } = await ctx.admin
            .from('api_keys')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', ctx.tenant.id);
        if (countError) throw mapPostgrestError(countError);

        // Transform keys - mask the full key
        const transformedKeys = (apiKeys || []).map((key: Record<string, unknown>) => ({
            id: key.id,
            name: key.name,
            key_prefix: key.key_prefix,
            permissions: key.permissions,
            rate_limit: key.rate_limit,
            expires_at: key.expires_at,
            last_used_at: key.last_used_at,
            last_used_ip: key.last_used_ip,
            usage_count: key.usage_count,
            is_active: key.is_active,
            created_at: key.created_at,
            created_by: (key.created_by_user as Record<string, string>)?.email || 'Unknown',
        }));

        const response = listAdminApiKeysResponseSchema.parse({
            items: transformedKeys,
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

// POST /api/admin/api-keys - Create a new API key
async function POST(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_api_keys", "write");

        const parsedBody = createAdminApiKeyRequestSchema.safeParse(await parseJson(req));
        if (!parsedBody.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: zodErrorToDetails(parsedBody.error),
            });
        }

        const { name, permissions, rate_limit, expires_at } = parsedBody.data;

        // Generate secure API key
        const crypto = await import('crypto');
        const rawKey = 'pk_' + crypto.randomBytes(32).toString('hex');
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
        const keyPrefix = rawKey.substring(0, 12);

        // Insert API key (use service role to bypass RLS)
        const { data: apiKey, error } = await ctx.admin
            .from('api_keys')
            .insert({
                tenant_id: ctx.tenant.id,
                name,
                key_prefix: keyPrefix,
                key_hash: keyHash,
                permissions,
                rate_limit,
                expires_at,
                is_active: true,
                created_by: ctx.user.id,
            })
            .select()
            .single();

        if (error) throw mapPostgrestError(error);

        // Return the full key only once - this is the only time it's visible
        const response = createAdminApiKeyResponseSchema.parse({
            id: apiKey.id,
            name: apiKey.name,
            key_prefix: apiKey.key_prefix,
            // Full key - only shown once
            api_key: rawKey,
            permissions: apiKey.permissions,
            rate_limit: apiKey.rate_limit,
            expires_at: apiKey.expires_at,
            is_active: apiKey.is_active,
            created_at: apiKey.created_at,
            message: 'Save this API key - it will not be shown again',
        });

        return jsonOk(response, 201, rateLimitHeaders(rateLimit));
    } catch (error) {
        return jsonError(asErrorBody(error), asStatus(error), asHeaders(error));
    }
}

export { GET, POST };
