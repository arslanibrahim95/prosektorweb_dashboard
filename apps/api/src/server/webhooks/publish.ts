import { createHmac } from "crypto";
import {
    CONTRACT_VERSION,
    PublishWebhookBody,
    publishWebhookBodySchema,
} from "@prosektor/contracts";
import { logger } from "@/lib/logger";

const DEFAULT_WEBHOOK_TIMEOUT_MS = 3000;

function normalizeBaseUrl(value: string): string | null {
    try {
        const url = new URL(value);
        return url.toString().replace(/\/+$/, "");
    } catch {
        return null;
    }
}

function resolveWebhookTimeoutMs(): number {
    const parsed = Number(process.env.WEBHOOK_TIMEOUT_MS);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_WEBHOOK_TIMEOUT_MS;
    }
    return Math.floor(parsed);
}

export async function sendPublishWebhook(payload: Omit<PublishWebhookBody, "version" | "source">) {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    const BUILDER_API_URL = process.env.BUILDER_API_URL;

    if (!WEBHOOK_SECRET) {
        logger.error("[Webhook] WEBHOOK_SECRET is not defined");
        return;
    }
    if (!BUILDER_API_URL) {
        logger.error("[Webhook] BUILDER_API_URL is not defined");
        return;
    }
    const normalizedBuilderUrl = normalizeBaseUrl(BUILDER_API_URL);
    if (!normalizedBuilderUrl) {
        logger.error("[Webhook] BUILDER_API_URL is invalid");
        return;
    }

    const fullPayload: PublishWebhookBody = {
        ...payload,
        version: CONTRACT_VERSION,
        source: "dashboard",
    };

    // Validate payload before sending
    const parsed = publishWebhookBodySchema.safeParse(fullPayload);
    if (!parsed.success) {
        logger.error("[Webhook] Invalid payload", { issues: parsed.error.issues });
        return;
    }

    const timestamp = Date.now().toString();

    // SECURITY NOTE: Timestamp validation is performed by the RECEIVER of this webhook.
    // The receiver should verify that the x-timestamp header is within an acceptable window
    // (e.g., 5 minutes) to prevent replay attacks.
    // See: https://owasp.org/www-community/attacks/Replay_attack

    const bodyString = JSON.stringify(fullPayload);
    const signature = createHmac("sha256", WEBHOOK_SECRET)
        .update(`${timestamp}.${bodyString}`)
        .digest("hex");
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), resolveWebhookTimeoutMs());

    try {
        const res = await fetch(`${normalizedBuilderUrl}/api/internal/publish`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-signature": `sha256=${signature}`,
                "x-timestamp": timestamp,
                "x-trace-id": fullPayload.traceId,
            },
            body: bodyString,
            signal: abortController.signal,
        });

        if (!res.ok) {
            const body = await res.text();
            logger.error("[Webhook] Failed to send webhook", {
                status: res.status,
                statusText: res.statusText,
                body,
                traceId: fullPayload.traceId,
                siteSlug: fullPayload.site.slug,
            });
        } else {
            logger.info("[Webhook] Successfully sent webhook", {
                siteSlug: fullPayload.site.slug,
                traceId: fullPayload.traceId,
            });
        }
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            logger.error("[Webhook] Timeout sending webhook", {
                traceId: fullPayload.traceId,
            });
            return;
        }
        logger.error("[Webhook] Network error sending webhook", { err });
    } finally {
        clearTimeout(timeoutId);
    }
}
