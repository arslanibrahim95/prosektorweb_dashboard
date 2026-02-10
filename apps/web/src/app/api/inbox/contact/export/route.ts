import { contactMessageSchema, uuidSchema } from "@prosektor/contracts";
import { z } from "zod";
import { NextResponse } from "next/server";
import { toCsv } from "@/server/api/csv";
import {
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  mapPostgrestError,
  zodErrorToDetails,
} from "@/server/api/http";
import { requireAuthContext } from "@/server/auth/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportContactQuerySchema = z
  .object({
    site_id: uuidSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(10000).default(10000),
    search: z.string().min(1).optional(),
    status: z.enum(["read", "unread"]).optional(),
    date_from: z.string().min(1).optional(),
    date_to: z.string().min(1).optional(),
    format: z.string().optional(), // compat: frontend sets `format=csv`
  })
  .strict();

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const url = new URL(req.url);
    const qp = url.searchParams;

    const parsed = exportContactQuerySchema.safeParse({
      site_id: qp.get("site_id") ?? undefined,
      page: qp.get("page") ?? undefined,
      limit: qp.get("limit") ?? undefined,
      search: qp.get("search") ?? undefined,
      status: qp.get("status") ?? undefined,
      date_from: qp.get("date_from") ?? undefined,
      date_to: qp.get("date_to") ?? undefined,
      format: qp.get("format") ?? undefined,
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
      .from("contact_messages")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (parsed.data.site_id) query = query.eq("site_id", parsed.data.site_id);
    if (parsed.data.status === "read") query = query.eq("is_read", true);
    if (parsed.data.status === "unread") query = query.eq("is_read", false);
    if (parsed.data.date_from) query = query.gte("created_at", parsed.data.date_from);
    if (parsed.data.date_to) query = query.lte("created_at", parsed.data.date_to);
    if (parsed.data.search) {
      const term = parsed.data.search.replace(/%/g, "\\%");
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,subject.ilike.%${term}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw mapPostgrestError(error);

    const items = (data ?? []).map((m) => contactMessageSchema.parse(m));

    const headers = [
      "id",
      "created_at",
      "full_name",
      "email",
      "phone",
      "subject",
      "message",
      "is_read",
      "kvkk_accepted_at",
      "source",
    ];

    const rows = items.map((m) => [
      m.id,
      m.created_at,
      m.full_name,
      m.email,
      m.phone,
      m.subject ?? "",
      m.message,
      m.is_read,
      m.kvkk_accepted_at,
      m.source ?? {},
    ]);

    const csv = toCsv(headers, rows);
    const today = new Date().toISOString().slice(0, 10);
    const filename = parsed.data.site_id
      ? `contact_${parsed.data.site_id}_${today}.csv`
      : `contact_${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err));
  }
}

