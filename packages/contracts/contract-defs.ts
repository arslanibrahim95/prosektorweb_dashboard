import { z } from "zod";
import { siteStatusSchema, uuidSchema } from "./common";

export const CONTRACT_VERSION = "1.0";

// --- API Envelopes ---

export const apiSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.literal(true),
        version: z.literal(CONTRACT_VERSION),
    }).and(dataSchema); // Merges data fields into top level if dataSchema is object

export const apiErrorResponseSchema = z.object({
    success: z.literal(false),
    version: z.literal(CONTRACT_VERSION),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.string(), z.array(z.string())).optional(),
    }),
});
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

// --- Webhook Contracts ---

export const publishWebhookEventSchema = z.enum(["publish", "unpublish", "page_update", "site_update"]);
export type PublishWebhookEvent = z.infer<typeof publishWebhookEventSchema>;

export const publishWebhookBodySchema = z.object({
    version: z.literal(CONTRACT_VERSION),
    event: publishWebhookEventSchema,
    traceId: z.string().min(8),
    publishedAt: z.string().datetime({ offset: true }),
    site: z.object({
        id: uuidSchema,
        slug: z.string(),
        status: siteStatusSchema,
    }),
    pages: z.array(z.string()),
    source: z.literal("dashboard").default("dashboard"),
});
export type PublishWebhookBody = z.infer<typeof publishWebhookBodySchema>;
