import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const publishEnvironmentSchema = z.enum(["staging", "production"]);
export type PublishEnvironment = z.infer<typeof publishEnvironmentSchema>;

export const publishSiteRequestSchema = z.object({
  site_id: uuidSchema,
  environment: publishEnvironmentSchema,
});

export const publishSiteResponseSchema = z.object({
  site_id: uuidSchema,
  environment: publishEnvironmentSchema,
  published_at: isoDateTimeSchema,
});

