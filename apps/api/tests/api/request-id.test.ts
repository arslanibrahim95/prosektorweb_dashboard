/**
 * Request ID and Request Logger Tests
 * 
 * Tests for request ID generation, extraction, and logging utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateRequestId, getRequestId, withRequestId } from "@/server/api/request-id";
import { logRequest } from "@/server/api/request-logger";

describe("Request ID utilities", () => {
    describe("generateRequestId", () => {
        it("should generate a valid UUID", () => {
            const requestId = generateRequestId();

            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(requestId).toMatch(uuidRegex);
        });

        it("should generate unique IDs", () => {
            const id1 = generateRequestId();
            const id2 = generateRequestId();
            const id3 = generateRequestId();

            expect(id1).not.toBe(id2);
            expect(id2).not.toBe(id3);
            expect(id1).not.toBe(id3);
        });

        it("should generate IDs with correct length", () => {
            const requestId = generateRequestId();
            // UUID format is 36 characters (32 hex + 4 hyphens)
            expect(requestId).toHaveLength(36);
        });

        it("should generate lowercase UUIDs", () => {
            const requestId = generateRequestId();
            expect(requestId).toBe(requestId.toLowerCase());
        });
    });

    describe("getRequestId", () => {
        it("should extract request ID from x-request-id header", () => {
            const existingId = "550e8400-e29b-41d4-a716-446655440000";
            const headers = new Headers();
            headers.set("x-request-id", existingId);
            const req = new Request("https://example.com", { headers });

            const requestId = getRequestId(req);
            expect(requestId).toBe(existingId);
        });

        it("should generate new ID when header is missing", () => {
            const req = new Request("https://example.com");

            const requestId = getRequestId(req);

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(requestId).toMatch(uuidRegex);
        });

        it("should handle empty x-request-id header", () => {
            const headers = new Headers();
            headers.set("x-request-id", "");
            const req = new Request("https://example.com", { headers });

            const requestId = getRequestId(req);

            // Empty string is falsy, so should generate new ID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(requestId).toMatch(uuidRegex);
        });

        it("should preserve existing request ID format", () => {
            const customId = "custom-request-id-123";
            const headers = new Headers();
            headers.set("x-request-id", customId);
            const req = new Request("https://example.com", { headers });

            const requestId = getRequestId(req);
            expect(requestId).toBe(customId);
        });

        it("should be case-insensitive for header name", () => {
            const existingId = "550e8400-e29b-41d4-a716-446655440000";
            const headers = new Headers();
            headers.set("X-Request-ID", existingId);
            const req = new Request("https://example.com", { headers });

            const requestId = getRequestId(req);
            expect(requestId).toBe(existingId);
        });
    });

    describe("withRequestId", () => {
        it("should add x-request-id header to response", () => {
            const response = new Response("test body");
            const requestId = "550e8400-e29b-41d4-a716-446655440000";

            const modifiedResponse = withRequestId(response, requestId);

            expect(modifiedResponse.headers.get("x-request-id")).toBe(requestId);
        });

        it("should return the same response object", () => {
            const response = new Response("test body");
            const requestId = "550e8400-e29b-41d4-a716-446655440000";

            const modifiedResponse = withRequestId(response, requestId);

            expect(modifiedResponse).toBe(response);
        });

        it("should overwrite existing x-request-id header", () => {
            const headers = new Headers();
            headers.set("x-request-id", "old-id");
            const response = new Response("test body", { headers });
            const newRequestId = "550e8400-e29b-41d4-a716-446655440000";

            const modifiedResponse = withRequestId(response, newRequestId);

            expect(modifiedResponse.headers.get("x-request-id")).toBe(newRequestId);
        });

        it("should preserve other headers", () => {
            const headers = new Headers();
            headers.set("content-type", "application/json");
            headers.set("x-custom-header", "custom-value");
            const response = new Response("test body", { headers });
            const requestId = "550e8400-e29b-41d4-a716-446655440000";

            const modifiedResponse = withRequestId(response, requestId);

            expect(modifiedResponse.headers.get("content-type")).toBe("application/json");
            expect(modifiedResponse.headers.get("x-custom-header")).toBe("custom-value");
            expect(modifiedResponse.headers.get("x-request-id")).toBe(requestId);
        });

        it("should preserve response body", async () => {
            const body = "test response body";
            const response = new Response(body);
            const requestId = "550e8400-e29b-41d4-a716-446655440000";

            const modifiedResponse = withRequestId(response, requestId);
            const responseText = await modifiedResponse.text();

            expect(responseText).toBe(body);
        });

        it("should preserve response status", () => {
            const response = new Response("test body", { status: 201 });
            const requestId = "550e8400-e29b-41d4-a716-446655440000";

            const modifiedResponse = withRequestId(response, requestId);

            expect(modifiedResponse.status).toBe(201);
        });
    });
});

describe("Request Logger", () => {
    let consoleInfoSpy: any;
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => { });
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        consoleInfoSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe("logRequest", () => {
        it("should log with info level for 2xx status codes", () => {
            const startTime = Date.now();
            logRequest("GET", "/api/test", "req-123", startTime, 200);

            expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();

            const logMessage = consoleInfoSpy.mock.calls[0][0];
            expect(logMessage).toContain("[req-123]");
            expect(logMessage).toContain("GET");
            expect(logMessage).toContain("/api/test");
            expect(logMessage).toContain("200");
            expect(logMessage).toMatch(/\d+ms$/);
        });

        it("should log with info level for 3xx status codes", () => {
            const startTime = Date.now();
            logRequest("GET", "/api/redirect", "req-456", startTime, 301);

            expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it("should log with warn level for 4xx status codes", () => {
            const startTime = Date.now();
            logRequest("POST", "/api/test", "req-789", startTime, 400);

            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();

            const logMessage = consoleWarnSpy.mock.calls[0][0];
            expect(logMessage).toContain("[req-789]");
            expect(logMessage).toContain("POST");
            expect(logMessage).toContain("/api/test");
            expect(logMessage).toContain("400");
        });

        it("should log with warn level for 404 status code", () => {
            const startTime = Date.now();
            logRequest("GET", "/api/notfound", "req-404", startTime, 404);

            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it("should log with error level for 5xx status codes", () => {
            const startTime = Date.now();
            logRequest("GET", "/api/error", "req-500", startTime, 500);

            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleInfoSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();

            const logMessage = consoleErrorSpy.mock.calls[0][0];
            expect(logMessage).toContain("[req-500]");
            expect(logMessage).toContain("GET");
            expect(logMessage).toContain("/api/error");
            expect(logMessage).toContain("500");
        });

        it("should log with error level for 503 status code", () => {
            const startTime = Date.now();
            logRequest("POST", "/api/unavailable", "req-503", startTime, 503);

            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        });

        it("should calculate duration correctly", () => {
            const startTime = Date.now() - 150; // 150ms ago
            logRequest("GET", "/api/test", "req-time", startTime, 200);

            const logMessage = consoleInfoSpy.mock.calls[0][0];
            // Duration should be around 150ms (with some tolerance)
            expect(logMessage).toMatch(/1[0-9]{2}ms$/);
        });

        it("should include all request details in log message", () => {
            const startTime = Date.now();
            logRequest("PUT", "/api/users/123", "req-full", startTime, 200);

            const logMessage = consoleInfoSpy.mock.calls[0][0];
            expect(logMessage).toContain("[req-full]");
            expect(logMessage).toContain("PUT");
            expect(logMessage).toContain("/api/users/123");
            expect(logMessage).toContain("200");
            expect(logMessage).toMatch(/\d+ms$/);
        });

        it("should handle different HTTP methods", () => {
            const startTime = Date.now();

            logRequest("GET", "/api/test", "req-1", startTime, 200);
            logRequest("POST", "/api/test", "req-2", startTime, 201);
            logRequest("PUT", "/api/test", "req-3", startTime, 200);
            logRequest("DELETE", "/api/test", "req-4", startTime, 204);
            logRequest("PATCH", "/api/test", "req-5", startTime, 200);

            expect(consoleInfoSpy).toHaveBeenCalledTimes(5);
        });

        it("should handle long paths", () => {
            const startTime = Date.now();
            const longPath = "/api/v1/users/123/posts/456/comments/789/replies";

            logRequest("GET", longPath, "req-long", startTime, 200);

            const logMessage = consoleInfoSpy.mock.calls[0][0];
            expect(logMessage).toContain(longPath);
        });

        it("should handle paths with query parameters", () => {
            const startTime = Date.now();
            const pathWithQuery = "/api/search?q=test&page=1&limit=50";

            logRequest("GET", pathWithQuery, "req-query", startTime, 200);

            const logMessage = consoleInfoSpy.mock.calls[0][0];
            expect(logMessage).toContain(pathWithQuery);
        });

        it("should handle zero duration", () => {
            const startTime = Date.now();
            logRequest("GET", "/api/fast", "req-fast", startTime, 200);

            const logMessage = consoleInfoSpy.mock.calls[0][0];
            expect(logMessage).toMatch(/\d+ms$/);
        });
    });
});
