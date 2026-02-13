import { z } from "zod";
import { isoDateTimeSchema, uuidSchema } from "./common";

const jobPostMiniSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1).max(200),
});

export const offerRequestSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  site_id: uuidSchema,
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  company_name: z.string().max(200).nullable().optional(),
  message: z.string().max(2000).nullable().optional(),
  kvkk_accepted_at: isoDateTimeSchema,
  source: z.record(z.string(), z.unknown()).default({}),
  is_read: z.boolean(),
  created_at: isoDateTimeSchema,
});

export const contactMessageSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  site_id: uuidSchema,
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  subject: z.string().max(200).nullable().optional(),
  message: z.string().min(1).max(5000),
  kvkk_accepted_at: isoDateTimeSchema,
  source: z.record(z.string(), z.unknown()).default({}),
  is_read: z.boolean(),
  created_at: isoDateTimeSchema,
});

export const jobApplicationSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  site_id: uuidSchema,
  job_post_id: uuidSchema,
  job_post: jobPostMiniSchema.optional(),
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  message: z.string().max(2000).nullable().optional(),
  cv_path: z.string().min(1),
  cv_file_name: z.string().min(1).max(255).optional(),
  kvkk_accepted_at: isoDateTimeSchema,
  is_read: z.boolean(),
  created_at: isoDateTimeSchema,
});

export const listOfferRequestsResponseSchema = z.object({
  items: z.array(offerRequestSchema),
  total: z.number().int(),
});

export const listContactMessagesResponseSchema = z.object({
  items: z.array(contactMessageSchema),
  total: z.number().int(),
});

export const listJobApplicationsResponseSchema = z.object({
  items: z.array(jobApplicationSchema),
  total: z.number().int(),
});

// Spec-friendly aliases
export const InboxOffersResponseSchema = listOfferRequestsResponseSchema;
export const InboxContactResponseSchema = listContactMessagesResponseSchema;
export const InboxHrApplicationsResponseSchema = listJobApplicationsResponseSchema;

export const markReadRequestSchema = z.object({
  is_read: z.boolean(),
});

export const bulkMarkReadRequestSchema = z
  .object({
    ids: z.array(uuidSchema).min(1).max(500),
  })
  .strict();

export const bulkMarkReadResponseSchema = z.object({
  updated: z.number().int().min(0),
});

export const getCvSignedUrlResponseSchema = z.object({
  url: z.string().url(),
  expires_at: isoDateTimeSchema,
});
