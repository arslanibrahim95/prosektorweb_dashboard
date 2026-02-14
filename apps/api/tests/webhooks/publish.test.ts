import { describe, expect, it, vi, beforeEach } from "vitest";
import { sendPublishWebhook } from "../../src/server/webhooks/publish";
import { createHmac } from "crypto";

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("sendPublishWebhook", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        process.env.WEBHOOK_SECRET = "test-secret";
        process.env.BUILDER_API_URL = "http://builder.test";
    });

    it("should send correct payload and headers", async () => {
        const payload = {
            event: "publish" as const,
            traceId: "test-trace-id",
            publishedAt: new Date().toISOString(),
            site: { // Use valid UUID
                id: "d5e8656d-e967-4279-a720-671e612bd857",
                slug: "test-slug",
                status: "published" as const,
            },
            pages: ["page1"],
        };

        fetchMock.mockResolvedValue({
            ok: true,
            text: async () => "ok",
        } as Response);

        await sendPublishWebhook(payload);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];

        expect(url).toBe("http://builder.test/api/internal/publish");
        expect(options.method).toBe("POST");
        expect(options.headers["Content-Type"]).toBe("application/json");
        expect(options.headers["x-trace-id"]).toBe("test-trace-id");
        expect(options.headers["x-timestamp"]).toBeDefined();
        expect(options.headers["x-signature"]).toBeDefined();

        const sentBody = JSON.parse(options.body);
        expect(sentBody.version).toBe("1.0");
        expect(sentBody.site.slug).toBe(payload.site.slug);
    });

    it("should generate correct HMAC signature", async () => {
        const payload = {
            event: "publish" as const,
            traceId: "test-trace-id",
            publishedAt: new Date().toISOString(),
            site: {
                id: "d5e8656d-e967-4279-a720-671e612bd857", // uuid
                slug: "test-slug",
                status: "published" as const
            },
            pages: [],
        };

        let capturedSignature = "";
        let capturedTimestamp = "";
        let capturedBody = "";

        fetchMock.mockImplementation((url, options) => {
            capturedSignature = options.headers["x-signature"];
            capturedTimestamp = options.headers["x-timestamp"];
            capturedBody = options.body;
            return Promise.resolve({ ok: true } as Response);
        });

        await sendPublishWebhook(payload);

        const expectedSignature = `sha256=${createHmac("sha256", "test-secret")
            .update(`${capturedTimestamp}.${capturedBody}`)
            .digest("hex")}`;

        expect(capturedSignature).toBe(expectedSignature);
    });
});
