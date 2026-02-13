import { z } from "zod";
import { isoDateTimeSchema, moduleKeySchema, uuidSchema } from "./common";

const emailRecipientsSchema = z.array(z.string().email()).default([]);

export const offerModuleSettingsSchema = z.object({
  recipients: emailRecipientsSchema,
  success_message: z.string().min(1).max(2000).optional(),
  kvkk_legal_text_id: uuidSchema.optional(),
  // Backwards-compatible (older UI may still store raw text)
  kvkk_text: z.string().min(1).max(20000).optional(),
});

export const contactModuleSettingsSchema = z.object({
  recipients: emailRecipientsSchema,
  address: z.string().min(1).max(500).optional(),
  phones: z.array(z.string().min(1).max(50)).default([]),
  emails: emailRecipientsSchema,
  map_embed_url: z.string().min(1).max(2000).optional(),
  success_message: z.string().min(1).max(2000).optional(),
  kvkk_legal_text_id: uuidSchema.optional(),
  // Backwards-compatible (older UI may still store raw text)
  kvkk_text: z.string().min(1).max(20000).optional(),
});

export const hrModuleSettingsSchema = z.object({
  recipients: emailRecipientsSchema,
  kvkk_legal_text_id: uuidSchema.optional(),
  // Backwards-compatible (older UI may still store raw text)
  kvkk_text: z.string().min(1).max(20000).optional(),
  max_file_size_mb: z.number().int().min(1).max(50).default(5),
  allowed_mime_types: z
    .array(z.string().min(1))
    .default([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
});

export const legalModuleSettingsSchema = z.object({
  kvkk_text: z.string().min(1).max(20000).optional(),
  disclosure_text: z.string().min(1).max(20000).optional(),
});

export const moduleSettingsSchema = z.discriminatedUnion("module_key", [
  z.object({ module_key: z.literal("offer"), settings: offerModuleSettingsSchema }),
  z.object({ module_key: z.literal("contact"), settings: contactModuleSettingsSchema }),
  z.object({ module_key: z.literal("hr"), settings: hrModuleSettingsSchema }),
  z.object({ module_key: z.literal("legal"), settings: legalModuleSettingsSchema }),
]);

export const moduleInstanceSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  site_id: uuidSchema,
  module_key: moduleKeySchema,
  enabled: z.boolean(),
  settings: z.record(z.string(), z.unknown()).default({}),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const updateModuleInstanceRequestSchema = z
  .object({
    enabled: z.boolean().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
