import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { uuidSchema } from "@prosektor/contracts";
import { getServerEnv } from "./env";
import { HttpError } from "./api/http";

export const SITE_TOKEN_AUDIENCE = "public-form";

const siteTokenPayloadSchema = z
  .object({
    site_id: uuidSchema,
  })
  .passthrough();

export type SiteTokenPayload = z.infer<typeof siteTokenPayloadSchema>;

const DEFAULT_SITE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

export async function signSiteToken(
  siteId: string,
  opts?: { expiresInSeconds?: number },
): Promise<{ token: string; expires_at: string }> {
  const env = getServerEnv();
  const secret = new TextEncoder().encode(env.siteTokenSecret);

  const exp = Math.floor(Date.now() / 1000) + (opts?.expiresInSeconds ?? DEFAULT_SITE_TOKEN_TTL_SECONDS);

  const token = await new SignJWT({ site_id: siteId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience(SITE_TOKEN_AUDIENCE)
    .setExpirationTime(exp)
    .sign(secret);

  return { token, expires_at: new Date(exp * 1000).toISOString() };
}

export async function verifySiteToken(token: string): Promise<SiteTokenPayload> {
  const env = getServerEnv();
  const secret = new TextEncoder().encode(env.siteTokenSecret);

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      audience: SITE_TOKEN_AUDIENCE,
    });

    const parsed = siteTokenPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new HttpError(404, { code: "SITE_NOT_FOUND", message: "Invalid site token" });
    }

    return parsed.data;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(404, { code: "SITE_NOT_FOUND", message: "Invalid site token" });
  }
}
