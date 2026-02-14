import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

export const employmentTypeSchema = z.enum(["full-time", "part-time", "contract"]);
export type EmploymentType = z.infer<typeof employmentTypeSchema>;

export const jobPostSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  site_id: uuidSchema,
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  location: z.string().max(200).nullable().optional(),
  employment_type: employmentTypeSchema.nullable().optional(),
  description: z.unknown().nullable().optional(),
  requirements: z.unknown().nullable().optional(),
  is_active: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  deleted_at: isoDateTimeSchema.nullable().optional(),
  applications_count: z.number().int().nonnegative().optional(),
});
export type JobPost = z.infer<typeof jobPostSchema>;

// Spec-friendly aliases
export const HrJobPostSchema = jobPostSchema;

export const listJobPostsQuerySchema = z
  .object({
    site_id: uuidSchema,
    include_deleted: z.coerce.boolean().optional(),
  })
  .strict();

export const listJobPostsResponseSchema = z.object({
  items: z.array(jobPostSchema),
  total: z.number().int(),
});

export const createJobPostRequestSchema = z
  .object({
    site_id: uuidSchema,
    title: z.string().min(1).max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    location: z.string().max(200).optional(),
    employment_type: employmentTypeSchema.optional(),
    description: z.unknown().optional(),
    requirements: z.unknown().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export const updateJobPostRequestSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    location: z.string().max(200).nullable().optional(),
    employment_type: employmentTypeSchema.nullable().optional(),
    description: z.unknown().nullable().optional(),
    requirements: z.unknown().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

export const HrJobPostCreateSchema = createJobPostRequestSchema;
export const HrJobPostUpdateSchema = updateJobPostRequestSchema;
