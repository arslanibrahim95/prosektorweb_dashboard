/**
 * Generic bulk mark-as-read handler factory for inbox routes
 * Eliminates duplication across inbox bulk-read endpoints
 */

import { bulkMarkReadRequestSchema, bulkMarkReadResponseSchema } from "@prosektor/contracts";
import {
    asErrorBody,
    asStatus,
    HttpError,
    jsonError,
    jsonOk,
    mapPostgrestError,
    parseJson,
    zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { hasPermission } from "@/server/auth/permissions";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { getInboxDbClient } from "./query-utils";

/**
 * Creates a generic bulk mark-as-read POST handler
 * Marks multiple inbox items as read
 */
export function createBulkReadHandler(tableName: string) {
    return async function POST(req: Request) {
        try {
            const ctx = await requireAuthContext(req);
            const env = getServerEnv();

            // Authorization parity with inbox list/export
            if (!hasPermission(ctx.permissions, "inbox:read")) {
                throw new HttpError(403, { code: "FORBIDDEN", message: "Bu işlem için yetkiniz yok." });
            }

            const rateLimit = await enforceRateLimit(
                ctx.admin,
                rateLimitAuthKey("inbox_bulk_read", ctx.tenant.id, ctx.user.id),
                env.dashboardReadRateLimit,
                env.dashboardReadRateWindowSec,
            );
            const body = await parseJson(req);

            const parsed = bulkMarkReadRequestSchema.safeParse(body);
            if (!parsed.success) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Validation failed",
                    details: zodErrorToDetails(parsed.error),
                });
            }

            // SECURITY: Limit the number of IDs to prevent unbounded operations
            if (parsed.data.ids.length > 500) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Tek seferde en fazla 500 öğe işlenebilir.",
                });
            }

            const dbClient = getInboxDbClient(ctx);

            // FIX: Use the IDs filter with tenant_id to prevent cross-tenant updates
            const { data, error } = await dbClient
                .from(tableName)
                .update({ is_read: true })
                .eq("tenant_id", ctx.tenant.id)
                .in("id", parsed.data.ids)
                .select("id");

            if (error) throw mapPostgrestError(error);

            return jsonOk(
                bulkMarkReadResponseSchema.parse({
                    updated: data?.length ?? 0,
                }),
                200,
                rateLimitHeaders(rateLimit),
            );
        } catch (err) {
            return jsonError(asErrorBody(err), asStatus(err));
        }
    };
}
