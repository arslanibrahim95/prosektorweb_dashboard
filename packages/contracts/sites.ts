import { z } from "zod";
import { isoDateTimeSchema, siteStatusSchema, uuidSchema } from "./common";

export const siteSchema = z.object({
  id: uuidSchema,
  tenant_id: uuidSchema,
  name: z.string().min(1).max(200),
  status: siteStatusSchema,
  primary_domain: z.string().min(1).max(255).nullable().optional(),
  settings: z.record(z.string(), z.unknown()).default({}),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});
export type Site = z.infer<typeof siteSchema>;

export const listSitesResponseSchema = z.object({
  items: z.array(siteSchema),
  total: z.number().int(),
});

export const createSiteRequestSchema = z
  .object({
    name: z.string().min(1).max(200),
    primary_domain: z.string().min(1).max(255).optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const updateSiteRequestSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    primary_domain: z.string().min(1).max(255).nullable().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const getSiteTokenResponseSchema = z.object({
  site_token: z.string().min(1),
  expires_at: isoDateTimeSchema,
});

// ---------------------------------------------------------------------------
// SEO Settings
// ---------------------------------------------------------------------------

export const seoSettingsSchema = z
  .object({
    title_template: z.string().min(1).max(200).default("%s | %s"),
    default_description: z.string().max(160).optional(),
    og_image: z.string().max(500).optional(),
    robots_txt: z.string().max(5000).optional(),
    json_ld: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type SEOSettings = z.infer<typeof seoSettingsSchema>;

export const getSEOSettingsResponseSchema = seoSettingsSchema;

export const updateSEOSettingsRequestSchema = seoSettingsSchema
  .partial()
  .strict();

