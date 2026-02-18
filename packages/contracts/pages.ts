import { z } from "zod";
import { isoDateTimeSchema, pageStatusSchema, uuidSchema } from "./common";

export const seoSchema = z
  .object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    og_image: z.string().url().optional(),
  })
  .strict();

export const pageOriginSchema = z.enum(["panel", "site_engine", "unknown"]);
export type PageOrigin = z.infer<typeof pageOriginSchema>;

export const pageSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  site_id: uuidSchema,
  slug: z.string().min(0).max(200),
  title: z.string().min(1).max(200),
  status: pageStatusSchema,
  seo: seoSchema.default({}),
  origin: pageOriginSchema,
  order_index: z.number().int(),
  draft_revision_id: uuidSchema.nullable().optional(),
  staging_revision_id: uuidSchema.nullable().optional(),
  published_revision_id: uuidSchema.nullable().optional(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  deleted_at: isoDateTimeSchema.nullable().optional(),
});
export type Page = z.infer<typeof pageSchema>;

export const blockSchema = z.object({
  id: uuidSchema,
  type: z.string().min(1).max(64),
  props: z.record(z.string(), z.unknown()).default({}),
});
export type Block = z.infer<typeof blockSchema>;

export const pageRevisionSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  page_id: uuidSchema,
  meta: z.record(z.string(), z.unknown()).default({}),
  created_at: isoDateTimeSchema,
  created_by: uuidSchema.nullable().optional(),
  blocks: z.array(blockSchema).optional(), // API may inline the ordered blocks
});
export type PageRevision = z.infer<typeof pageRevisionSchema>;

export const listPagesQuerySchema = z.object({
  site_id: uuidSchema,
});

export const listPagesResponseSchema = z.object({
  items: z.array(pageSchema),
  total: z.number().int(),
});

export const createPageRequestSchema = z.object({
  site_id: uuidSchema,
  title: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]*$/), // allow '' for homepage
  seo: seoSchema.optional(),
  order_index: z.number().int().optional(),
});

export const updatePageRequestSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    slug: z.string().regex(/^[a-z0-9-]*$/).optional(),
    status: pageStatusSchema.optional(),
    seo: seoSchema.optional(),
    order_index: z.number().int().optional(),
  })
  .strict();

export const createRevisionRequestSchema = z.object({
  blocks: z.array(blockSchema).min(0),
});

export const listRevisionsResponseSchema = z.object({
  items: z.array(pageRevisionSchema),
  total: z.number().int(),
});
