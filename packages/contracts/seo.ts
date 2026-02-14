import { z } from "zod";
import { uuidSchema } from "./common";

// ---------------------------------------------------------------------------
// Structured Data Schemas
// ---------------------------------------------------------------------------

export const webSiteSchemaSchema = z
  .object({
    "@context": z.literal("https://schema.org").optional(),
    "@type": z.literal("WebSite"),
    name: z.string(),
    url: z.string().url(),
    description: z.string().optional(),
    alternateName: z.string().optional(),
    potentialAction: z
      .array(
        z.object({
          "@type": z.literal("SearchAction"),
          target: z.string().url(),
          "query-input": z.string(),
        })
      )
      .optional(),
  })
  .strict();

export type WebSiteSchema = z.infer<typeof webSiteSchemaSchema>;

export const organizationSchemaSchema = z
  .object({
    "@context": z.literal("https://schema.org").optional(),
    "@type": z.literal("Organization"),
    name: z.string(),
    url: z.string().url(),
    logo: z.string().url().optional(),
    description: z.string().optional(),
    sameAs: z.array(z.string().url()).optional(),
    contactPoint: z
      .array(
        z.object({
          "@type": z.literal("ContactPoint"),
          telephone: z.string(),
          contactType: z.string(),
          email: z.string().email().optional(),
        })
      )
      .optional(),
    address: z
      .object({
        "@type": z.literal("PostalAddress"),
        streetAddress: z.string().optional(),
        addressLocality: z.string().optional(),
        addressRegion: z.string().optional(),
        postalCode: z.string().optional(),
        addressCountry: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export type OrganizationSchema = z.infer<typeof organizationSchemaSchema>;

export const breadcrumbItemSchema = z.object({
  "@type": z.literal("ListItem"),
  position: z.number(),
  name: z.string(),
  item: z.string().url().optional(),
});

export const breadcrumbListSchemaSchema = z
  .object({
    "@context": z.literal("https://schema.org").optional(),
    "@type": z.literal("BreadcrumbList"),
    itemListElement: z.array(breadcrumbItemSchema),
  })
  .strict();

export type BreadcrumbListSchema = z.infer<typeof breadcrumbListSchemaSchema>;

export const articleSchemaSchema = z
  .object({
    "@context": z.literal("https://schema.org").optional(),
    "@type": z.enum(["Article", "NewsArticle", "BlogPosting"]),
    headline: z.string(),
    image: z.array(z.string().url()).optional(),
    author: z
      .array(
        z.union([
          z.object({
            "@type": z.literal("Person"),
            name: z.string(),
          }),
          z.object({
            "@type": z.literal("Organization"),
            name: z.string(),
          }),
        ])
      )
      .optional(),
    datePublished: z.string().optional(),
    dateModified: z.string().optional(),
    description: z.string().optional(),
    publisher: z
      .object({
        "@type": z.literal("Organization"),
        name: z.string(),
        logo: z.string().url().optional(),
      })
      .optional(),
    mainEntityOfPage: z
      .object({
        "@type": z.literal("WebPage"),
        "@id": z.string().url(),
      })
      .optional(),
  })
  .strict();

export type ArticleSchema = z.infer<typeof articleSchemaSchema>;

// Union type for all structured data types
export const structuredDataSchema = z.discriminatedUnion("@type", [
  webSiteSchemaSchema,
  organizationSchemaSchema,
  breadcrumbListSchemaSchema,
  articleSchemaSchema,
]);

export type StructuredData = z.infer<typeof structuredDataSchema>;

// ---------------------------------------------------------------------------
// Sitemap Entry
// ---------------------------------------------------------------------------

export const sitemapEntrySchema = z.object({
  url: z.string().url(),
  lastModified: z.date().optional(),
  changeFrequency: z
    .enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"])
    .optional(),
  priority: z.number().min(0).max(1).optional(),
});

export type SitemapEntry = z.infer<typeof sitemapEntrySchema>;
