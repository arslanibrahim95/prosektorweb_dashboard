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

/**
 * Creates a generic bulk mark-as-read POST handler
 * Marks multiple inbox items as read
 */
export function createBulkReadHandler(tableName: string) {
    return async function POST(req: Request) {
        try {
            const ctx = await requireAuthContext(req);
            const body = await parseJson(req);

            const parsed = bulkMarkReadRequestSchema.safeParse(body);
            if (!parsed.success) {
                throw new HttpError(400, {
                    code: "VALIDATION_ERROR",
                    message: "Validation failed",
                    details: zodErrorToDetails(parsed.error),
                });
            }

            const { data, error } = await ctx.supabase
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
            );
        } catch (err) {
            return jsonError(asErrorBody(err), asStatus(err));
        }
    };
}
