import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const legalTextTypeSchema = z.enum(["kvkk", "consent", "terms", "privacy", "disclosure"]);
export type LegalTextType = z.infer<typeof legalTextTypeSchema>;

export const legalTextSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  title: z.string().min(1).max(200),
  type: legalTextTypeSchema,
  content: z.string().min(1).max(20000),
  version: z.number().int().min(1),
  is_active: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
export type LegalText = z.infer<typeof legalTextSchema>;

export const listLegalTextsQuerySchema = z
  .object({
    type: legalTextTypeSchema.optional(),
    is_active: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();

export const listLegalTextsResponseSchema = z.object({
  items: z.array(legalTextSchema),
  total: z.number().int(),
});

export const createLegalTextRequestSchema = z
  .object({
    title: z.string().min(1).max(200),
    type: legalTextTypeSchema,
    content: z.string().min(1).max(20000),
    is_active: z.boolean().optional(),
  })
  .strict();

export const updateLegalTextRequestSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    type: legalTextTypeSchema.optional(),
    content: z.string().min(1).max(20000).optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

