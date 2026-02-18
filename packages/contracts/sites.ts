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

export const vibeBriefSchema = z
  .object({
    business_name: z.string().min(2).max(120),
    business_summary: z.string().min(20).max(1200),
    target_audience: z.string().min(5).max(300),
    tone_keywords: z.array(z.string().min(2).max(30)).min(1).max(8),
    goals: z.array(z.string().min(2).max(120)).min(1).max(6),
    must_have_sections: z.array(z.string().min(2).max(120)).min(1).max(10),
    primary_cta: z.string().min(2).max(120),
    updated_at: isoDateTimeSchema,
  })
  .strict();

export type VibeBrief = z.infer<typeof vibeBriefSchema>;

export const saveVibeBriefRequestSchema = z
  .object({
    business_name: z.string().min(2).max(120),
    business_summary: z.string().min(20).max(1200),
    target_audience: z.string().min(5).max(300),
    tone_keywords: z.array(z.string().min(2).max(30)).min(1).max(8),
    goals: z.array(z.string().min(2).max(120)).min(1).max(6),
    must_have_sections: z.array(z.string().min(2).max(120)).min(1).max(10),
    primary_cta: z.string().min(2).max(120),
    create_panel_homepage: z.boolean().default(true),
  })
  .strict();

export const saveVibeBriefResponseSchema = z
  .object({
    site: siteSchema,
    homepage: z
      .object({
        id: uuidSchema,
        origin: z.enum(["panel", "site_engine", "unknown"]),
      })
      .nullable(),
  })
  .strict();

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
