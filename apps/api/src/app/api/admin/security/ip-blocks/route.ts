import {
    HttpError,
    jsonOk,
    mapPostgrestError,
    parseJson,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { assertAdminRole } from "@/server/admin/access";
import { enforceAdminRateLimit, withAdminErrorHandling } from "@/server/admin/route-utils";
import { rateLimitHeaders } from "@/server/rate-limit";
import { cacheStore, getOrSetCachedValue } from "@/server/cache";
import { z } from "zod";
import { isIP } from "net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const IP_BLOCKS_CACHE_TTL_SEC = 60;
const IP_BLOCKS_CACHE_PREFIX = "admin-ip-blocks";

function getIpBlocksCacheKey(tenantId: string, page: number, limit: number): string {
    return [IP_BLOCKS_CACHE_PREFIX, tenantId, page, limit].join("|");
}

function clearIpBlocksCacheForTenant(tenantId: string): number {
    const prefix = `${IP_BLOCKS_CACHE_PREFIX}|${tenantId}|`;
    let cleared = 0;

    for (const key of cacheStore.keys()) {
        if (key.startsWith(prefix) && cacheStore.delete(key)) {
            cleared += 1;
        }
    }

    return cleared;
}

// Check if string is valid CIDR notation (IPv4)
function isIpv4Cidr(value: string): boolean {
    const parts = value.split('/');
    if (parts.length !== 2) return false;

    const ip = parts[0];
    const prefixStr = parts[1];
    if (!ip || !prefixStr) return false;

    const prefix = parseInt(prefixStr, 10);

    // Validate prefix
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    // Validate IP
    return isIP(ip) === 4;
}

// Validate IP address format (IPv4, IPv6, or CIDR)
function validateIpAddress(ip: string): { valid: boolean; error?: string } {
    const trimmed = ip.trim();

    if (!trimmed || trimmed.length === 0) {
        return { valid: false, error: "IP adresi boş olamaz" };
    }

    // Check IPv4 or IPv6
    if (isIP(trimmed)) {
        return { valid: true };
    }

    // Check IPv4 CIDR (e.g., 192.168.1.0/24)
    if (isIpv4Cidr(trimmed)) {
        return { valid: true };
    }

    return { valid: false, error: "Geçerli bir IP adresi (IPv4, IPv6 veya CIDR notation) giriniz" };
}

// Supports both plain IPv4/IPv6 and CIDR notation (e.g. 192.168.1.0/24)
const ipBlockSchema = z.object({
    ip_address: z.string()
        .min(1, "IP adresi gerekli")
        .refine(
            (val) => validateIpAddress(val).valid,
            { message: "Geçerli bir IP adresi (IPv4, IPv6 veya CIDR notation) giriniz" }
        ),
    reason: z.string().max(500).trim().optional(),
    blocked_until: z.string().datetime().optional().nullable(),
});

// GET /api/admin/security/ip-blocks - List IP blocks
export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);
        assertAdminRole(ctx.role);
        const rateLimit = await enforceAdminRateLimit(ctx, "admin_ip_blocks", "read");

        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)), 100);
        const offset = (page - 1) * limit;
        const cacheKey = getIpBlocksCacheKey(ctx.tenant.id, page, limit);

        const payload = await getOrSetCachedValue(cacheKey, IP_BLOCKS_CACHE_TTL_SEC, async () => {
            // Get IP blocks
            const { data: blocks, error, count } = await ctx.admin
                .from("ip_blocks")
                .select("id, ip_address, reason, blocked_until, created_by, created_at", { count: "exact" })
                .eq("tenant_id", ctx.tenant.id)
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw mapPostgrestError(error);

            // Get creator info
            const creatorIds = Array.from(new Set((blocks ?? []).map((b) => b.created_by).filter(Boolean)));
            const creatorsById = new Map<string, { email?: string }>();

            if (creatorIds.length > 0) {
                await Promise.all(
                    creatorIds.map(async (creatorId) => {
                        try {
                            const { data: userData } = await ctx.admin.auth.admin.getUserById(creatorId);
                            if (userData?.user) {
                                creatorsById.set(creatorId, { email: userData.user.email ?? undefined });
                            }
                        } catch {
                            // Ignore errors for deleted users
                        }
                    }),
                );
            }

            const enrichedBlocks = (blocks ?? []).map((block) => {
                const creator = block.created_by ? creatorsById.get(block.created_by) : null;
                return {
                    ...block,
                    created_by_email: creator?.email,
                };
            });

            return {
                items: enrichedBlocks,
                total: count ?? 0,
                page,
                limit,
            };
        });

        return jsonOk(payload, 200, rateLimitHeaders(rateLimit));
});

// POST /api/admin/security/ip-blocks - Create IP block
export const POST = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_ip_blocks_write", {
            limit: 10,
            windowSeconds: 60,
        });

        const body = await parseJson(req);
        const parsed = ipBlockSchema.safeParse(body);

        if (!parsed.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Geçersiz parametreler",
            });
        }

        const { ip_address, reason, blocked_until } = parsed.data;

        // Check if already blocked
        const { data: existing } = await ctx.admin
            .from("ip_blocks")
            .select("id")
            .eq("tenant_id", ctx.tenant.id)
            .eq("ip_address", ip_address)
            .maybeSingle();

        if (existing) {
            throw new HttpError(409, {
                code: "CONFLICT",
                message: "Bu IP adresi zaten engellenmiş",
            });
        }

        // Create IP block
        const { data: block, error } = await ctx.admin
            .from("ip_blocks")
            .insert({
                tenant_id: ctx.tenant.id,
                ip_address,
                reason: reason ?? null,
                blocked_until: blocked_until ?? null,
                created_by: ctx.user.id,
            })
            .select()
            .single();

        if (error) throw mapPostgrestError(error);

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "ip_block_create",
            entity_type: "ip_block",
            entity_id: block.id,
            meta: { ip_address, reason, blocked_until },
        });

        clearIpBlocksCacheForTenant(ctx.tenant.id);

        return jsonOk({ block }, 201, rateLimitHeaders(rateLimit));
});

// PATCH /api/admin/security/ip-blocks?id=<uuid> - Update IP block
export const PATCH = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_ip_blocks_write", {
            limit: 10,
            windowSeconds: 60,
        });

        const url = new URL(req.url);
        const blockId = url.searchParams.get("id");

        if (!blockId) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "IP block id parametresi gerekli",
            });
        }

        const body = await parseJson(req);
        const parsed = ipBlockSchema.safeParse(body);

        if (!parsed.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Geçersiz parametreler",
            });
        }

        // Verify the block belongs to this tenant
        const { data: existing, error: lookupError } = await ctx.admin
            .from("ip_blocks")
            .select("id, ip_address")
            .eq("id", blockId)
            .eq("tenant_id", ctx.tenant.id)
            .maybeSingle();

        if (lookupError) throw mapPostgrestError(lookupError);

        if (!existing) {
            throw new HttpError(404, {
                code: "NOT_FOUND",
                message: "IP bloğu bulunamadı",
            });
        }

        const { ip_address, reason, blocked_until } = parsed.data;

        // Check for duplicate IP if address changed
        if (ip_address !== existing.ip_address) {
            const { data: duplicate } = await ctx.admin
                .from("ip_blocks")
                .select("id")
                .eq("tenant_id", ctx.tenant.id)
                .eq("ip_address", ip_address)
                .neq("id", blockId)
                .maybeSingle();

            if (duplicate) {
                throw new HttpError(409, {
                    code: "CONFLICT",
                    message: "Bu IP adresi zaten engellenmiş",
                });
            }
        }

        const { data: block, error } = await ctx.admin
            .from("ip_blocks")
            .update({
                ip_address,
                reason: reason ?? null,
                blocked_until: blocked_until ?? null,
            })
            .eq("id", blockId)
            .eq("tenant_id", ctx.tenant.id)
            .select()
            .single();

        if (error) throw mapPostgrestError(error);

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "ip_block_update",
            entity_type: "ip_block",
            entity_id: blockId,
            meta: { ip_address, reason, blocked_until },
        });

        clearIpBlocksCacheForTenant(ctx.tenant.id);

        return jsonOk({ block }, 200, rateLimitHeaders(rateLimit));
});

// DELETE /api/admin/security/ip-blocks?id=<uuid> - Remove IP block
export const DELETE = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_ip_blocks_write", {
            limit: 10,
            windowSeconds: 60,
        });

        const url = new URL(req.url);
        const blockId = url.searchParams.get("id");

        if (!blockId) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "IP block id parametresi gerekli",
            });
        }

        // Verify the block belongs to this tenant
        const { data: existing, error: lookupError } = await ctx.admin
            .from("ip_blocks")
            .select("id, ip_address")
            .eq("id", blockId)
            .eq("tenant_id", ctx.tenant.id)
            .maybeSingle();

        if (lookupError) throw mapPostgrestError(lookupError);

        if (!existing) {
            throw new HttpError(404, {
                code: "NOT_FOUND",
                message: "IP bloğu bulunamadı",
            });
        }

        // Delete the block
        const { error: deleteError } = await ctx.admin
            .from("ip_blocks")
            .delete()
            .eq("id", blockId)
            .eq("tenant_id", ctx.tenant.id);

        if (deleteError) throw mapPostgrestError(deleteError);

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "ip_block_delete",
            entity_type: "ip_block",
            entity_id: blockId,
            meta: { ip_address: existing.ip_address },
        });

        clearIpBlocksCacheForTenant(ctx.tenant.id);

        return jsonOk({ success: true, id: blockId }, 200, rateLimitHeaders(rateLimit));
});
