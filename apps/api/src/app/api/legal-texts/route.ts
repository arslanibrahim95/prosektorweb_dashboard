import {
  createLegalTextRequestSchema,
  legalTextSchema,
  listLegalTextsQuerySchema,
  listLegalTextsResponseSchema,
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

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const url = new URL(req.url);
    const qp = url.searchParams;

    const parsed = listLegalTextsQuerySchema.safeParse({
      type: qp.get("type") ?? undefined,
      is_active: qp.get("is_active") ?? undefined,
      page: qp.get("page") ?? undefined,
      limit: qp.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const from = (parsed.data.page - 1) * parsed.data.limit;
    const to = from + parsed.data.limit - 1;

    let query = ctx.supabase
      .from("legal_texts")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (parsed.data.type) query = query.eq("type", parsed.data.type);
    if (parsed.data.is_active !== undefined) query = query.eq("is_active", parsed.data.is_active);

    const { data, error, count } = await query;
    if (error) throw mapPostgrestError(error);

    return jsonOk(
      listLegalTextsResponseSchema.parse({
        items: (data ?? []).map((t) => legalTextSchema.parse(t)),
        total: count ?? 0,
      }),
    );
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const body = await parseJson(req);

    const parsed = createLegalTextRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const nowIso = new Date().toISOString();

    const { data, error } = await ctx.supabase
      .from("legal_texts")
      .insert({
        tenant_id: ctx.tenant.id,
        title: parsed.data.title,
        type: parsed.data.type,
        content: parsed.data.content,
        version: 1,
        is_active: parsed.data.is_active ?? true,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .single();
    if (error) throw mapPostgrestError(error);

    return jsonOk(legalTextSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

