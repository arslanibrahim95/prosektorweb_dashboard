import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const builderComponentCategorySchema = z.enum([
  "hero",
  "content",
  "form",
  "navigation",
  "layout",
  "media",
  "custom",
]);
export type BuilderComponentCategory = z.infer<typeof builderComponentCategorySchema>;

export const builderComponentSchema = z
  .object({
    id: uuidSchema,
    tenant_id: uuidSchema.optional(),
    name: z.string().min(1).max(200),
    category: builderComponentCategorySchema,
    component_type: z.string().min(1).max(100),
    schema: z.record(z.string(), z.unknown()).default({}),
    default_props: z.record(z.string(), z.unknown()).default({}),
    thumbnail_url: z.string().url().nullable().optional(),
    icon: z.string().min(1).max(100).nullable().optional(),
    is_system: z.boolean().default(false),
    is_active: z.boolean().default(true),
    created_at: isoDateTimeSchema.optional(),
    updated_at: isoDateTimeSchema.optional(),
  })
  .passthrough();
export type BuilderComponent = z.infer<typeof builderComponentSchema>;

export const listBuilderComponentsQuerySchema = z
  .object({
    category: builderComponentCategorySchema.optional(),
    search: z.string().min(1).max(120).optional(),
  })
  .strict();

export const listBuilderComponentsResponseSchema = z.object({
  items: z.array(builderComponentSchema),
  total: z.number().int().nonnegative(),
});

export const createBuilderComponentRequestSchema = z
  .object({
    name: z.string().min(1).max(200),
    category: builderComponentCategorySchema,
    component_type: z.string().min(1).max(100),
    schema: z.record(z.string(), z.unknown()).optional(),
    default_props: z.record(z.string(), z.unknown()).optional(),
    thumbnail_url: z.string().url().optional(),
    icon: z.string().min(1).max(100).optional(),
  })
  .strict();

export const updateBuilderLayoutRequestSchema = z
  .object({
    layout_data: z.record(z.string(), z.unknown()).optional(),
    preview_data: z.record(z.string(), z.unknown()).optional(),
    previous_layout_data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const publishBuilderLayoutResponseSchema = z.object({
  success: z.literal(true),
  revision_id: uuidSchema,
});
