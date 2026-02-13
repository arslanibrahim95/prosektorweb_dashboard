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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
      .from("offer_requests")
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
}
