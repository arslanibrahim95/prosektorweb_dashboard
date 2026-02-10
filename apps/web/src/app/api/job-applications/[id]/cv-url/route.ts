import { getCvSignedUrlResponseSchema } from "@prosektor/contracts";
import {
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
} from "@/server/api/http";
import { getServerEnv } from "@/server/env";
import { requireAuthContext } from "@/server/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const env = getServerEnv();
    const { id } = await ctxRoute.params;

    const { data: app, error: appError } = await ctx.supabase
      .from("job_applications")
      .select("id, cv_path")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", id)
      .maybeSingle();
    if (appError) throw mapPostgrestError(appError);
    if (!app) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    // Defense-in-depth: ensure path follows our tenant prefix convention.
    const expectedPrefix = `tenant_${ctx.tenant.id}/cv/`;
    if (!app.cv_path.startsWith(expectedPrefix)) {
      throw new HttpError(403, { code: "FORBIDDEN", message: "Forbidden" });
    }

    const expiresInSeconds = 60;
    const { data: signed, error: signedError } = await ctx.admin.storage
      .from(env.storageBucketPrivateCv)
      .createSignedUrl(app.cv_path, expiresInSeconds);

    if (signedError || !signed) {
      throw new HttpError(500, { code: "INTERNAL_ERROR", message: "Failed to create signed url" });
    }

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return jsonOk(
      getCvSignedUrlResponseSchema.parse({
        url: signed.signedUrl,
        expires_at: expiresAt,
      }),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
