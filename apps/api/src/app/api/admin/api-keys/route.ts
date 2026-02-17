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

// Validation schema for creating API key
const createApiKeySchema = {
    name: (val: unknown) => {
        if (typeof val !== 'string' || val.length < 1 || val.length > 255) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Name must be between 1 and 255 characters",
            });
        }
        return val;
    },
    permissions: (val: unknown) => {
        if (val !== undefined) {
            if (!Array.isArray(val) || !val.every((item) => typeof item === "string" && item.length > 0)) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Permissions must be a non-empty string array",
                });
            }
            return val as string[];
        }
        return ['read'];
    },
    rate_limit: (val: unknown) => {
        if (val !== undefined) {
            const num = Number(val);
            if (isNaN(num) || num < 1 || num > 10000) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Rate limit must be between 1 and 10000",
                });
            }
            return num;
        }
        return 1000;
    },
    expires_at: (val: unknown) => {
        if (val !== undefined && val !== null) {
            const date = new Date(String(val));
            if (isNaN(date.getTime())) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Invalid expires_at date",
                });
            }
            return date.toISOString();
        }
        return null;
    },
};

// GET /api/admin/api-keys - List all API keys for the tenant
async function GET(req: NextRequest) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        const env = getServerEnv();
        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_api_keys", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const { searchParams } = new URL(req.url);
        const page = parsePositiveIntParam(searchParams.get("page"), 1, MAX_PAGE, "page");
        const limit = parsePositiveIntParam(searchParams.get("limit"), 20, MAX_LIMIT, "limit");
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

        if (error) {
            console.error('Error fetching API keys:', error);
            return jsonError({ code: 'FETCH_ERROR', message: 'Failed to fetch API keys' }, 500);
        }

        // Get total count
        const { count, error: countError } = await ctx.admin
            .from('api_keys')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', ctx.tenant.id);
        if (countError) {
            console.error('Error fetching API key count:', countError);
            return jsonError({ code: 'FETCH_ERROR', message: 'Failed to fetch API key count' }, 500);
        }

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

        return jsonOk({
            items: transformedKeys,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('API keys GET error:', error);
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status);
        }
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500);
    }
}

// POST /api/admin/api-keys - Create a new API key
async function POST(req: NextRequest) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role, "Admin yetkisi gerekli");

        await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_api_keys_write", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        const parsedBody = await parseJson(req);
        const body = asRecord(parsedBody);

        // Validate and parse request body
        const name = createApiKeySchema.name(body.name);
        const permissions = createApiKeySchema.permissions(body.permissions);
        const rate_limit = createApiKeySchema.rate_limit(body.rate_limit);
        const expires_at = createApiKeySchema.expires_at(body.expires_at);

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

        if (error) {
            console.error('Error creating API key:', error);
            return jsonError({ code: 'CREATE_ERROR', message: 'Failed to create API key' }, 500);
        }

        // Return the full key only once - this is the only time it's visible
        return jsonOk({
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
        }, 201);
    } catch (error) {
        console.error('API keys POST error:', error);
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status);
        }
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500);
    }
}

export { GET, POST };
