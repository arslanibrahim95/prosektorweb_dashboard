import {
  blockSchema,
  createRevisionRequestSchema,
  listRevisionsResponseSchema,
  pageRevisionSchema,
  uuidSchema,
} from "@prosektor/contracts";
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

export async function GET(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const pageIdParsed = uuidSchema.safeParse(id);
    if (!pageIdParsed.success) {
      throw new HttpError(400, { code: "VALIDATION_ERROR", message: "Invalid page id" });
    }

    const { data, error, count } = await ctx.supabase
      .from("page_revisions")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .eq("page_id", pageIdParsed.data)
      .order("created_at", { ascending: false });

    if (error) throw mapPostgrestError(error);

    const response = {
      items: (data ?? []).map((r) => pageRevisionSchema.parse(r)),
      total: count ?? 0,
    };

    return jsonOk(listRevisionsResponseSchema.parse(response));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function POST(req: Request, ctxRoute: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext(req);
    const { id } = await ctxRoute.params;
    const pageIdParsed = uuidSchema.safeParse(id);
    if (!pageIdParsed.success) {
      throw new HttpError(400, { code: "VALIDATION_ERROR", message: "Invalid page id" });
    }

    const body = await parseJson(req);
    const parsed = createRevisionRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    // Ensure page exists (and belongs to tenant).
    const { data: page, error: pageError } = await ctx.supabase
      .from("pages")
      .select("id")
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", pageIdParsed.data)
      .maybeSingle();
    if (pageError) throw mapPostgrestError(pageError);
    if (!page) throw new HttpError(404, { code: "NOT_FOUND", message: "Not found" });

    const { data: revision, error: revisionError } = await ctx.supabase
      .from("page_revisions")
      .insert({
        tenant_id: ctx.tenant.id,
        page_id: pageIdParsed.data,
        meta: {},
        created_by: ctx.user.id,
      })
      .select("*")
      .single();
    if (revisionError) throw mapPostgrestError(revisionError);

    const blocks = parsed.data.blocks.map((b) => blockSchema.parse(b));

    if (blocks.length > 0) {
      const { error: blockError } = await ctx.supabase.from("blocks").upsert(
        blocks.map((b) => ({
          id: b.id,
          tenant_id: ctx.tenant.id,
          type: b.type,
          props: b.props,
          created_by: ctx.user.id,
        })),
        { onConflict: "id" },
      );
      if (blockError) throw mapPostgrestError(blockError);

      const { error: pageBlocksError } = await ctx.supabase.from("page_blocks").insert(
        blocks.map((b, idx) => ({
          tenant_id: ctx.tenant.id,
          page_revision_id: revision.id,
          block_id: b.id,
          order_index: idx,
          region: "main",
        })),
      );
      if (pageBlocksError) throw mapPostgrestError(pageBlocksError);
    }

    const { error: pageUpdateError } = await ctx.supabase
      .from("pages")
      .update({ draft_revision_id: revision.id })
      .eq("tenant_id", ctx.tenant.id)
      .eq("id", pageIdParsed.data);
    if (pageUpdateError) throw mapPostgrestError(pageUpdateError);

    const response = pageRevisionSchema.parse({
      ...revision,
      blocks,
    });

    return jsonOk(response);
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
