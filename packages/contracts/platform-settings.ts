import { z } from "zod";
import { isoDateTimeSchema } from "./common";

export const platformSettingsPayloadSchema = z.record(z.string(), z.unknown());

export const platformSettingsSchema = z.object({
  key: z.string().min(1).max(120),
  value: platformSettingsPayloadSchema,
  updated_by: z.string().uuid().nullable(),
  updated_at: isoDateTimeSchema,
});
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export const platformSettingsResponseSchema = z.object({
  items: z.array(platformSettingsSchema),
});
export type PlatformSettingsResponse = z.infer<typeof platformSettingsResponseSchema>;

export const platformSettingsUpsertItemSchema = z.object({
  key: z.string().min(1).max(120),
  value: platformSettingsPayloadSchema,
});

export const platformSettingsUpdateRequestSchema = z
  .object({
    items: z.array(platformSettingsUpsertItemSchema).min(1).max(100),
  })
  .strict();

