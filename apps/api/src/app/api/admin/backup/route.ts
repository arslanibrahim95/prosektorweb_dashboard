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
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backupSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(["full", "partial", "config"]).optional(),
});

// GET /api/admin/backup - List backups
export const GET = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_backup", "read");

        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)), 100);
        const offset = (page - 1) * limit;

        // Get backups
        let query = ctx.admin
            .from("backups")
            .select("id, name, type, status, file_url, file_size, metadata, created_by, created_at, completed_at", { count: "exact" })
            .eq("tenant_id", ctx.tenant.id);

        const status = url.searchParams.get("status");
        if (status) {
            query = query.eq("status", status);
        }

        const { data: backups, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw mapPostgrestError(error);

        // Get creator info
        const creatorIds = Array.from(new Set((backups ?? []).map((b) => b.created_by).filter(Boolean)));
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
                        // Ignore errors
                    }
                }),
            );
        }

        const enrichedBackups = (backups ?? []).map((backup) => {
            const creator = backup.created_by ? creatorsById.get(backup.created_by) : null;
            return {
                ...backup,
                created_by_email: creator?.email,
            };
        });

        return jsonOk(
            {
                items: enrichedBackups,
                total: count ?? 0,
                page,
                limit,
            },
            200,
            rateLimitHeaders(rateLimit),
        );
});

// POST /api/admin/backup - Create a new backup
export const POST = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_backup", {
            limit: 5,
            windowSeconds: 300,
        });

        const body = await parseJson(req);
        const parsed = backupSchema.safeParse(body);

        if (!parsed.success) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Geçersiz parametreler",
            });
        }

        const { name, type = "full" } = parsed.data;

        // Create backup record with "pending" status
        const { data: backup, error } = await ctx.admin
            .from("backups")
            .insert({
                tenant_id: ctx.tenant.id,
                name,
                type,
                status: "pending",
                created_by: ctx.user.id,
            })
            .select()
            .single();

        if (error) throw mapPostgrestError(error);

        // Simulate completed backup immediately (in production, use a job queue)
        const fileSizeMB = Math.floor(Math.random() * 450) + 50; // 50-500 MB
        const { data: updatedBackup, error: updateError } = await ctx.admin
            .from("backups")
            .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                file_size: fileSizeMB * 1024 * 1024, // bytes
                file_url: `/api/admin/backup/download?id=${backup.id}`,
            })
            .eq("id", backup.id)
            .select()
            .single();

        if (updateError) throw mapPostgrestError(updateError);

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "backup_create",
            entity_type: "backup",
            entity_id: backup.id,
            meta: { name, type },
        });

        return jsonOk(
            {
                backup: updatedBackup,
                message: "Yedekleme tamamlandı.",
            },
            201,
            rateLimitHeaders(rateLimit),
        );
});

// DELETE /api/admin/backup?id=<uuid> - Delete a backup
export const DELETE = withAdminErrorHandling(async (req: Request) => {
        const ctx = await requireAuthContext(req);

        assertAdminRole(ctx.role);

        const rateLimit = await enforceAdminRateLimit(ctx, "admin_backup", {
            limit: 5,
            windowSeconds: 300,
        });

        const url = new URL(req.url);
        const backupId = url.searchParams.get("id");

        if (!backupId) {
            throw new HttpError(400, {
                code: "VALIDATION_ERROR",
                message: "Backup id parametresi gerekli",
            });
        }

        // Verify the backup belongs to this tenant
        const { data: existing, error: lookupError } = await ctx.admin
            .from("backups")
            .select("id, name")
            .eq("id", backupId)
            .eq("tenant_id", ctx.tenant.id)
            .maybeSingle();

        if (lookupError) throw mapPostgrestError(lookupError);

        if (!existing) {
            throw new HttpError(404, {
                code: "NOT_FOUND",
                message: "Yedek bulunamadı",
            });
        }

        const { error: deleteError } = await ctx.admin
            .from("backups")
            .delete()
            .eq("id", backupId)
            .eq("tenant_id", ctx.tenant.id);

        if (deleteError) throw mapPostgrestError(deleteError);

        // Log the action
        await ctx.admin.from("audit_logs").insert({
            tenant_id: ctx.tenant.id,
            actor_id: ctx.user.id,
            action: "backup_delete",
            entity_type: "backup",
            entity_id: backupId,
            meta: { name: existing.name },
        });

        return jsonOk({ success: true, id: backupId }, 200, rateLimitHeaders(rateLimit));
});
