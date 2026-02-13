import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";
import { SITE_TOKEN_AUDIENCE, verifySiteToken } from "../../src/server/site-token";

beforeAll(() => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  process.env.SITE_TOKEN_SECRET = "test-site-token-secret";
});

async function signToken(payload: Record<string, unknown>, audience: string = SITE_TOKEN_AUDIENCE) {
  const secret = new TextEncoder().encode(process.env.SITE_TOKEN_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience(audience)
    .sign(secret);
}

describe("verifySiteToken", () => {
  it("accepts a valid HS256 JWT with site_id", async () => {
    const siteId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const token = await signToken({ site_id: siteId });

    const payload = await verifySiteToken(token);
    expect(payload.site_id).toBe(siteId);
  });

  it("rejects tokens with wrong audience", async () => {
    const siteId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const token = await signToken({ site_id: siteId }, "other-aud");

    await expect(verifySiteToken(token)).rejects.toMatchObject({ status: 404 });
  });

  it("rejects tokens missing site_id", async () => {
    const token = await signToken({ foo: "bar" });

    await expect(verifySiteToken(token)).rejects.toMatchObject({ status: 404 });
  });
});

