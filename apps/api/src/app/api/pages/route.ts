import {
  createPageRequestSchema,
  listPagesQuerySchema,
  listPagesResponseSchema,
  pageSchema,
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

    const parsedQuery = listPagesQuerySchema.safeParse({
      site_id: url.searchParams.get("site_id"),
    });
    if (!parsedQuery.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsedQuery.error),
      });
    }

    const { data, error, count } = await ctx.supabase
      .from("pages")
      .select("*", { count: "exact" })
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", parsedQuery.data.site_id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true });

    if (error) throw mapPostgrestError(error);

    const response = {
      items: (data ?? []).map((p) => pageSchema.parse(p)),
      total: count ?? 0,
    };

    return jsonOk(listPagesResponseSchema.parse(response));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const body = await parseJson(req);

    const parsed = createPageRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const insertRow: Record<string, unknown> = {
      tenant_id: ctx.tenant.id,
      site_id: parsed.data.site_id,
      title: parsed.data.title,
      slug: parsed.data.slug,
      origin: ctx.role === "super_admin" ? "site_engine" : "panel",
    };
    if (parsed.data.seo !== undefined) insertRow.seo = parsed.data.seo;
    if (parsed.data.order_index !== undefined) insertRow.order_index = parsed.data.order_index;

    const { data, error } = await ctx.supabase
      .from("pages")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) throw mapPostgrestError(error);
    return jsonOk(pageSchema.parse(data));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}
