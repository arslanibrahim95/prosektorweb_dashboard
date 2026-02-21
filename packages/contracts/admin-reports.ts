import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const adminReportTypeSchema = z.enum([
  "users",
  "content",
  "analytics",
  "revenue",
  "custom",
]);

export const adminReportFormatSchema = z.enum(["csv", "xlsx", "pdf"]);

export const listAdminReportsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.string().min(1).max(64).optional(),
    type: adminReportTypeSchema.optional(),
  })
  .strict();

export const adminReportSchema = z
  .object({
    id: uuidSchema,
    tenant_id: uuidSchema.optional(),
    name: z.string().min(1).max(255),
    type: adminReportTypeSchema,
    format: adminReportFormatSchema,
    status: z.string().min(1).max(64),
    parameters: z.record(z.string(), z.unknown()).default({}).optional(),
    file_size: z.number().int().nonnegative().nullable().optional(),
    file_url: z.string().min(1).nullable().optional(),
    expires_at: isoDateTimeSchema.optional(),
    completed_at: isoDateTimeSchema.nullable().optional(),
    created_at: isoDateTimeSchema.optional(),
    created_by: z.string().optional(),
  })
  .passthrough();

export const listAdminReportsResponseSchema = z.object({
  items: z.array(adminReportSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().nonnegative(),
});

export const createAdminReportRequestSchema = z
  .object({
    name: z.string().min(1).max(255),
    type: adminReportTypeSchema,
    format: adminReportFormatSchema.optional().default("csv"),
    parameters: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .strict();

export const createAdminReportResponseSchema = adminReportSchema.extend({
  message: z.string().min(1),
});

export const deleteAdminReportQuerySchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const deleteAdminReportResponseSchema = z.object({
  success: z.literal(true),
  id: z.string().min(1),
});

