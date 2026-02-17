import {
    asHeaders,
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
} from "@/server/api/http";
import { type UserRole } from "@prosektor/contracts";
import { requireAuthContext } from "@/server/auth/context";
import { isAdminRole } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertAdminRole(role: UserRole) {
    if (!isAdminRole(role)) {
        throw new HttpError(403, { code: "FORBIDDEN", message: "Yönetici yetkisi gerekli" });
    }
}

// Supports both plain IPv4 and CIDR notation (e.g. 192.168.1.0/24)
const ipBlockSchema = z.object({
    ip_address: z.string().min(1, "IP adresi gerekli"),
    reason: z.string().max(500).optional(),
    blocked_until: z.string().datetime().optional().nullable(),
});

// GET /api/admin/security/ip-blocks - List IP blocks
export async function GET(req: Request) {
    try {
        const ctx = await requireAuthContext(req);
        const env = getServerEnv();

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_ip_blocks", ctx.tenant.id, ctx.user.id),
            env.dashboardReadRateLimit,
            env.dashboardReadRateWindowSec,
        );

        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)), 100);
        const offset = (page - 1) * limit;

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

        return jsonOk(
            {
                items: enrichedBlocks,
                total: count ?? 0,
                page,
                limit,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

// POST /api/admin/security/ip-blocks - Create IP block
export async function POST(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_ip_blocks_write", ctx.tenant.id, ctx.user.id),
            10, // More restrictive for write operations
            60,
        );

        const body = await req.json();
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

        return jsonOk({ block }, 201, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

// PATCH /api/admin/security/ip-blocks?id=<uuid> - Update IP block
export async function PATCH(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_ip_blocks_write", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

        const url = new URL(req.url);
        const blockId = url.searchParams.get("id");

        if (!blockId) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "IP block id parametresi gerekli",
            });
        }

        const body = await req.json();
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

        return jsonOk({ block }, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}

// DELETE /api/admin/security/ip-blocks?id=<uuid> - Remove IP block
export async function DELETE(req: Request) {
    try {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceRateLimit(
            ctx.admin,
            rateLimitAuthKey("admin_ip_blocks_write", ctx.tenant.id, ctx.user.id),
            10,
            60,
        );

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

        return jsonOk({ success: true, id: blockId }, 200, rateLimitHeaders(rateLimit));
    } catch (err) {
        return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
    }
}
