import { publishSiteRequestSchema, publishSiteResponseSchema, uuidSchema } from "@prosektor/contracts";
import { z } from "zod";
import {
  asHeaders,
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
import { enforceRateLimit, rateLimitAuthKey, rateLimitHeaders } from "@/server/rate-limit";
import { sendPublishWebhook } from "@/server/webhooks/publish";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLISH_WRITE_LIMIT = 30;
const PUBLISH_WRITE_WINDOW_SECONDS = 3600;

const publishSiteRpcResponseSchema = z.object({
  site_id: uuidSchema,
  tenant_id: uuidSchema,
  status: z.enum(["staging", "published"]),
  webhook_slug: z.string().nullable().optional(),
  page_ids: z.array(uuidSchema).nullable().optional(),
});

function mapPublishRpcError(error: { code?: string; message?: string }) {
  if (error.code === "P0002") {
    return new HttpError(404, { code: "NOT_FOUND", message: "Not found" });
  }

  if (error.code === "P0001") {
    return new HttpError(409, { code: "INVALID_STATE", message: "Site must be staging first" });
  }

  if (error.code === "22023") {
    return new HttpError(400, { code: "VALIDATION_ERROR", message: "Validation failed" });
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthContext(req);
    const rateLimit = await enforceRateLimit(
      ctx.admin,
      rateLimitAuthKey("publish", ctx.tenant.id, ctx.user.id),
      PUBLISH_WRITE_LIMIT,
      PUBLISH_WRITE_WINDOW_SECONDS,
    );
    const body = await parseJson(req);

    const parsed = publishSiteRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: zodErrorToDetails(parsed.error),
      });
    }

    // Authorization
    if (ctx.role === "viewer") {
      throw new HttpError(403, { code: "FORBIDDEN", message: "Forbidden" });
    }
    if (ctx.role === "editor" && parsed.data.environment !== "staging") {
      throw new HttpError(403, { code: "FORBIDDEN", message: "Forbidden" });
    }

    const nowIso = new Date().toISOString();
    const { data: rpcData, error: rpcError } = await ctx.admin.rpc("publish_site", {
      _tenant_id: ctx.tenant.id,
      _site_id: parsed.data.site_id,
      _environment: parsed.data.environment,
      _actor_id: ctx.user.id,
      _published_at: nowIso,
    });

    if (rpcError) {
      const mapped = mapPublishRpcError(rpcError);
      if (mapped) throw mapped;
      throw mapPostgrestError(rpcError);
    }

    const rpcResult = publishSiteRpcResponseSchema.parse(rpcData);

    const responseData = publishSiteResponseSchema.parse({
      site_id: parsed.data.site_id,
      environment: parsed.data.environment,
      published_at: nowIso,
    });

    const traceId = crypto.randomUUID();
    const webhookSlug = rpcResult.webhook_slug ?? undefined;

    if (webhookSlug) {
      void sendPublishWebhook({
        event: "publish",
        traceId,
        publishedAt: nowIso,
        site: {
          id: rpcResult.site_id,
          slug: webhookSlug,
          status: rpcResult.status,
        },
        pages: rpcResult.page_ids ?? [],
      }).catch((error) => {
        logger.error("[Publish] Webhook dispatch failed", {
          traceId,
          siteId: rpcResult.site_id,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
          } : error,
        });
      });
    }

    return jsonOk(responseData, 200, rateLimitHeaders(rateLimit));
  } catch (err) {
    return jsonError(asErrorBody(err), asStatus(err), asHeaders(err));
  }
}
