/// <reference lib="dom" />

import { z } from "zod";

const siteTokenSchema = z.string().min(1);
const honeypotSchema = z.string().max(0);

export const publicOfferSubmitSchema = z.object({
  site_token: siteTokenSchema,
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  company_name: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  kvkk_consent: z.literal(true),
  honeypot: honeypotSchema,
});

export const publicContactSubmitSchema = z.object({
  site_token: siteTokenSchema,
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  kvkk_consent: z.literal(true),
  honeypot: honeypotSchema,
});

export const publicJobApplyFieldsSchema = z.object({
  site_token: siteTokenSchema,
  job_post_id: z.string().uuid(),
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  message: z.string().max(2000).optional(),
  kvkk_consent: z.literal(true),
  honeypot: honeypotSchema,
});

export const cvFileSchema = z
  .custom<File>((v) => typeof File !== "undefined" && v instanceof File, "Invalid file")
  // SAFARI/ANDROID: browsers often send empty or application/octet-stream; defer real validation to server sniffing
  .refine(
    (file) => {
      if (!file.type || file.type === "application/octet-stream") return true;
      return [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type);
    },
    "Only PDF, DOC, DOCX allowed",
  )
  .refine((file) => file.size <= 5 * 1024 * 1024, "Max 5MB");

export const publicSubmitSuccessSchema = z.object({
  id: z.string().uuid(),
});

// Spec-friendly aliases (single source of truth remains the `public*` schemas above)
export const OfferSubmitSchema = publicOfferSubmitSchema;
export const ContactSubmitSchema = publicContactSubmitSchema;
export const HrApplySchema = publicJobApplyFieldsSchema;
export const HrApplyCvFileSchema = cvFileSchema;
export const PublicSubmitSuccessSchema = publicSubmitSuccessSchema;
