import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    getClientIp,
    getClientIpInfo,
    createRequestFingerprint,
    hashIp,
    randomId,
    rateLimitKey,
    rateLimitAuthKey,
    rateLimitHeaders,
} from "@/server/rate-limit";

describe("rate-limit module", () => {
    describe("getClientIp", () => {
        beforeEach(() => {
            vi.stubEnv("NODE_ENV", "development");
        });

        it("should extract IP from Cloudflare header", () => {
            const req = new Request("http://test.com", {
                headers: {
                    "cf-connecting-ip": "203.0.113.1",
                },
            });

            const ip = getClientIp(req);
            expect(ip).toBe("203.0.113.1");
        });

        it("should extract IP from X-Forwarded-For header", () => {
            const req = new Request("http://test.com", {
                headers: {
                    "x-forwarded-for": "198.51.100.1, 10.0.0.1",
                },
            });

            const ip = getClientIp(req);
            expect(ip).toBe("198.51.100.1");
        });

        it("should return fingerprint for missing IP in production", () => {
            vi.stubEnv("NODE_ENV", "production");
            const req = new Request("http://test.com", {
                headers: {
                    "user-agent": "TestAgent",
                    "accept": "text/html",
                },
            });

            const ip = getClientIp(req);
            expect(ip.startsWith("fp:")).toBe(true);
        });

        it("should handle empty X-Forwarded-For", () => {
            const req = new Request("http://test.com", {
                headers: {
                    "x-forwarded-for": "",
                },
            });

            const ip = getClientIp(req);
            expect(ip.startsWith("fp:")).toBe(true);
        });
    });

    describe("getClientIpInfo", () => {
        it("should return IP info for Cloudflare header", () => {
            const req = new Request("http://test.com", {
                headers: {
                    "cf-connecting-ip": "203.0.113.1",
                },
            });

            const info = getClientIpInfo(req);
            expect(info.ip).toBe("203.0.113.1");
            expect(info.source).toBe("cf-connecting-ip");
            expect(info.isV6).toBe(false);
            expect(info.isPrivate).toBe(false);
        });

        it("should detect private IP", () => {
            const req = new Request("http://test.com", {
                headers: {
                    "cf-connecting-ip": "10.0.0.1",
                },
            });

            const info = getClientIpInfo(req);
            expect(info.isPrivate).toBe(true);
        });

        it("should detect IPv6", () => {
            const req = new Request("http://test.com", {
                headers: {
                    "cf-connecting-ip": "2001:db8::1",
                },
            });

            const info = getClientIpInfo(req);
            expect(info.isV6).toBe(true);
        });

        it("should return default for missing headers", () => {
            const req = new Request("http://test.com");

            const info = getClientIpInfo(req);
            expect(info.ip).toBe("0.0.0.0");
            expect(info.source).toBe("remote-addr");
        });
    });

    describe("createRequestFingerprint", () => {
        it("should return fingerprint string of fixed length", () => {
            const req = new Request("http://test.com");
            const fp = createRequestFingerprint(req);

            expect(fp.length).toBe(32);
        });
    });

    describe("hashIp", () => {
        it("should return consistent hash for same IP", () => {
            vi.stubEnv("SUPABASE_SERVICE_KEY", "test-key");
            
            const hash1 = hashIp("192.168.1.1");
            const hash2 = hashIp("192.168.1.1");

            expect(hash1).toBe(hash2);
        });

        it("should return different hash for different IPs", () => {
            vi.stubEnv("SUPABASE_SERVICE_KEY", "test-key");
            
            const hash1 = hashIp("192.168.1.1");
            const hash2 = hashIp("192.168.1.2");

            expect(hash1).not.toBe(hash2);
        });
    });

    describe("randomId", () => {
        it("should generate random ID of default length", () => {
            const id = randomId();
            // 8 bytes = 16 hex characters
            expect(id.length).toBe(16);
        });

        it("should generate random ID of custom length", () => {
            const id = randomId(16);
            // 16 bytes = 32 hex characters
            expect(id.length).toBe(32);
        });

        it("should generate unique IDs", () => {
            const ids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                ids.add(randomId());
            }
            expect(ids.size).toBe(100);
        });
    });

    describe("rateLimitKey", () => {
        it("should create correct key format", () => {
            const key = rateLimitKey("api", "site123", "hash123");
            expect(key).toBe("rl:api:site123:hash123");
        });
    });

    describe("rateLimitAuthKey", () => {
        it("should create hashed auth key", () => {
            vi.stubEnv("SUPABASE_SERVICE_KEY", "test-key");
            
            const key = rateLimitAuthKey("api", "tenant123", "user123");
            
            expect(key).toMatch(/^rl:auth:api:tenant123:[a-f0-9]+$/);
        });
    });

    describe("rateLimitHeaders", () => {
        it("should create correct headers", () => {
            const result = {
                limit: 100,
                remaining: 50,
                resetAt: new Date(Date.now() + 60000).toISOString(),
            };

            const headers = rateLimitHeaders(result);

            expect(headers["x-ratelimit-limit"]).toBe("100");
            expect(headers["x-ratelimit-remaining"]).toBe("50");
            expect(headers["x-ratelimit-reset"]).toBeDefined();
        });

        it("should include retry-after when requested", () => {
            const result = {
                limit: 100,
                remaining: 0,
                resetAt: new Date(Date.now() + 60000).toISOString(),
            };

            const headers = rateLimitHeaders(result, { includeRetryAfter: true });

            expect(headers["retry-after"]).toBeDefined();
        });
    });
});
