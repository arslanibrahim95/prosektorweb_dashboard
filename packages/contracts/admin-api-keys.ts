import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

const dateLikeSchema = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date");

export const listAdminApiKeysQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const adminApiKeySchema = z
  .object({
    id: uuidSchema,
    name: z.string().min(1).max(255),
    key_prefix: z.string().min(1),
    permissions: z.array(z.string().min(1)),
    rate_limit: z.number().int().min(1).max(10_000),
    expires_at: isoDateTimeSchema.nullable().optional(),
    last_used_at: isoDateTimeSchema.nullable().optional(),
    last_used_ip: z.string().nullable().optional(),
    usage_count: z.number().int().nonnegative().optional(),
    is_active: z.boolean(),
    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema.optional(),
    created_by: z.string().optional(),
  })
  .passthrough();

export const listAdminApiKeysResponseSchema = z.object({
  items: z.array(adminApiKeySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
});

export const createAdminApiKeyRequestSchema = z
  .object({
    name: z.string().min(1).max(255),
    permissions: z.array(z.string().min(1)).min(1).optional().default(["read"]),
    rate_limit: z.coerce.number().int().min(1).max(10_000).optional().default(1000),
    expires_at: dateLikeSchema.nullable().optional().default(null),
  })
  .strict();

export const createAdminApiKeyResponseSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  key_prefix: z.string().min(1),
  api_key: z.string().min(1),
  permissions: z.array(z.string().min(1)),
  rate_limit: z.number().int().min(1).max(10_000),
  expires_at: isoDateTimeSchema.nullable().optional(),
  is_active: z.boolean(),
  created_at: isoDateTimeSchema,
  message: z.string().min(1),
});

export const updateAdminApiKeyRequestSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    is_active: z.boolean().optional(),
    rate_limit: z.coerce.number().int().min(1).max(10_000).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined || data.is_active !== undefined || data.rate_limit !== undefined,
    { message: "At least one updatable field is required", path: ["_"] },
  );

export const deleteAdminApiKeyResponseSchema = z.object({
  message: z.string().min(1),
});

