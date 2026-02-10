import { jwtVerify } from "jose";
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
