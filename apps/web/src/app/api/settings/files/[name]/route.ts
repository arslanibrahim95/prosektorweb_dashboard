import { asErrorBody, asHeaders, asStatus, jsonError, jsonOk } from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";
import { enforceAuthRouteRateLimit } from "@/server/auth/route-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "tenant-files";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const ctx = await requireAuthContext(req);
    await enforceAuthRouteRateLimit(ctx, req);

    const { name } = await params;
    const filename = decodeURIComponent(name);

    const { error } = await ctx.supabase.storage
      .from(BUCKET_NAME)
      .remove([`${ctx.tenant.id}/${filename}`]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return jsonOk({ filename });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
