import { jobPostSchema, updateJobPostRequestSchema } from "@prosektor/contracts";
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

export async function PATCH(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const body = await parseJson(req);

    const parsed = updateJobPostRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const { data, error } = await ctx.supabase
      .from("job_posts")
      .update(parsed.data)
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    return jsonOk(jobPostSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function DELETE(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;

    const { data, error } = await ctx.supabase
      .from("job_posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw mapPostgrestError(error);
    if (!data) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    return jsonOk(jobPostSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
