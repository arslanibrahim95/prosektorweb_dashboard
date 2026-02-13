import { listOfferRequestsResponseSchema, offerRequestSchema, uuidSchema } from "@prosektor/contracts";
import { z } from "zod";
import {
  asHeaders,
  asErrorBody,
  asStatus,
  HttpError,
  jsonError,
  jsonOk,
  mapPostgrestError,
  zodErrorToDetails,
} from "@/server/api/http";
import { buildSafeIlikeOr, safeSearchParamSchema } from "@/server/api/postgrest-search";
import { getOrSetCachedValue } from "@/server/cache";
import { requireAuthContext } from "@/server/auth/context";
import { getServerEnv } from "@/server/env";
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const INBOX_COUNT_CACHE_TTL_SEC = 30;

export const inboxOffersQuerySchema = z
  .object({
    site_id: uuidSchema,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    search: safeSearchParamSchema.optional(),
    status: z.enum(["read", "unread"]).optional(),
    date_from: z.string().min(1).optional(),
    date_to: z.string().min(1).optional(),
  })
  .strict();

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const env = getServerEnv();
    const url = new URL(req.url);
    const qp = url.searchParams;

    const parsed = inboxOffersQuerySchema.safeParse({
      site_id: qp.get("site_id"),
      page: qp.get("page") ?? undefined,
      limit: qp.get("limit") ?? undefined,
      search: qp.get("search") ?? undefined,
      status: qp.get("status") ?? undefined,
      date_from: qp.get("date_from") ?? undefined,
      date_to: qp.get("date_to") ?? undefined,
    });
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    const hasSearch = typeof parsed.data.search === "string";
    const rateLimit = await enforceRateLimit(
      ctx.admin,
      rateLimitAuthKey(
        hasSearch ? "inbox_offers_search" : "inbox_offers_list",
        ctx.tenant.id,
        ctx.user.id,
      ),
      hasSearch ? env.dashboardSearchRateLimit : env.dashboardReadRateLimit,
      hasSearch ? env.dashboardSearchRateWindowSec : env.dashboardReadRateWindowSec,
    );

    const from = (parsed.data.page - 1) * parsed.data.limit;
    const to = from + parsed.data.limit - 1;

    let dataQuery = ctx.supabase
      .from("offer_requests")
      .select(
        "id,tenant_id,site_id,full_name,email,phone,company_name,message,kvkk_accepted_at,source,is_read,created_at",
      )
      .eq("tenant_id", ctx.tenant.id)
      .eq("site_id", parsed.data.site_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (parsed.data.status === "read") dataQuery = dataQuery.eq("is_read", true);
    if (parsed.data.status === "unread") dataQuery = dataQuery.eq("is_read", false);
    if (parsed.data.date_from) dataQuery = dataQuery.gte("created_at", parsed.data.date_from);
    if (parsed.data.date_to) dataQuery = dataQuery.lte("created_at", parsed.data.date_to);
    if (parsed.data.search) {
      dataQuery = dataQuery.or(
        buildSafeIlikeOr(["full_name", "email", "company_name"], parsed.data.search),
      );
    }

    const { data, error } = await dataQuery;
    if (error) {
      throw mapPostgrestError(error);
    }

    const countCacheKey = [
      "inbox-count",
      "offers",
      ctx.tenant.id,
      parsed.data.site_id,
      parsed.data.status ?? "",
      parsed.data.date_from ?? "",
      parsed.data.date_to ?? "",
      parsed.data.search ?? "",
    ].join("|");

    const total = await getOrSetCachedValue<number>(countCacheKey, INBOX_COUNT_CACHE_TTL_SEC, async () => {
      let countQuery = ctx.supabase
        .from("offer_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenant.id)
        .eq("site_id", parsed.data.site_id);

      if (parsed.data.status === "read") countQuery = countQuery.eq("is_read", true);
      if (parsed.data.status === "unread") countQuery = countQuery.eq("is_read", false);
      if (parsed.data.date_from) countQuery = countQuery.gte("created_at", parsed.data.date_from);
      if (parsed.data.date_to) countQuery = countQuery.lte("created_at", parsed.data.date_to);
      if (parsed.data.search) {
        countQuery = countQuery.or(
          buildSafeIlikeOr(["full_name", "email", "company_name"], parsed.data.search),
        );
      }

      const { error: countError, count } = await countQuery;
      if (countError) {
        throw mapPostgrestError(countError);
      }
      return count ?? 0;
    });

    const response = listOfferRequestsResponseSchema.parse({
      items: (data ?? []).map((o) => offerRequestSchema.parse(o)),
      total,
    });

    return jsonOk(response, 200, rateLimitHeaders(rateLimit));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
