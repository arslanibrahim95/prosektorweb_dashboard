import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    apiErrorResponseSchema,
    apiSuccessEnvelopeSchema,
    CONTRACT_VERSION,
    publishWebhookBodySchema,
} from "../contract-defs";

describe("Contract Definitions", () => {
    it("should have correct contract version", () => {
        expect(CONTRACT_VERSION).toBe("1.0");
    });

    describe("API Envelopes", () => {
        it("should validate success envelope", () => {
            const dataSchema = z.object({ id: z.string() });
            const envelope = apiSuccessEnvelopeSchema(dataSchema);

            const validPayload = {
                success: true,
                version: "1.0",
                id: "123",
            };

            expect(envelope.parse(validPayload)).toEqual(validPayload);
        });

        it("should validate error envelope", () => {
            const validError = {
                success: false,
                version: "1.0",
                error: {
                    code: "TEST_ERROR",
                    message: "Test message",
                    details: { field: ["error"] },
                },
            };

            expect(apiErrorResponseSchema.parse(validError)).toEqual(validError);
        });
    });

    describe("Webhook Payload", () => {
        it("should validate publish webhook body", () => {
            const payload = {
                version: "1.0",
                event: "publish",
                traceId: "evt_2026_02_x1",
                publishedAt: "2026-02-10T20:00:00.000+03:00",
                site: {
                    id: "770e8400-e29b-41d4-a716-446655440000",
                    slug: "ornek-osgb",
                    status: "published",
                },
                pages: ["/"],
                source: "dashboard",
            };

            expect(publishWebhookBodySchema.parse(payload)).toEqual(payload);
        });
    });
});
