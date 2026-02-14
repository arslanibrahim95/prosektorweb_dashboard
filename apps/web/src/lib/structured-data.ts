import type {
  WebSiteSchema,
  OrganizationSchema,
  BreadcrumbListSchema,
  ArticleSchema,
} from "@prosektor/contracts";

/**
 * Generate WebSite structured data
 */
export function generateWebSiteSchema(params: {
  name: string;
  url: string;
  description?: string;
  alternateName?: string;
}): WebSiteSchema {
  const { name, url, description, alternateName } = params;

  const schema: WebSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  };

  if (description) schema.description = description;
  if (alternateName) schema.alternateName = alternateName;

  return schema;
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema(params: {
  name: string;
  url: string;
  description?: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    email?: string;
  }[];
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}): OrganizationSchema {
  const { name, url, description, logo, sameAs, contactPoint, address } = params;

  const schema: OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
  };

  if (description) schema.description = description;
  if (logo) schema.logo = logo;
  if (sameAs && sameAs.length > 0) schema.sameAs = sameAs;
  if (contactPoint && contactPoint.length > 0) {
    schema.contactPoint = contactPoint.map((cp) => ({
      "@type": "ContactPoint",
      ...cp,
    }));
  }
  if (address) {
    schema.address = {
      "@type": "PostalAddress",
      ...address,
    };
  }

  return schema;
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(params: {
  items: Array<{
    name: string;
    url?: string;
  }>;
}): BreadcrumbListSchema {
  const { items } = params;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * Generate Article structured data
 */
export function generateArticleSchema(params: {
  headline: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  description?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
  images?: string[];
}): ArticleSchema {
  const {
    headline,
    url,
    datePublished,
    dateModified,
    description,
    authorName,
    publisherName,
    publisherLogo,
    images,
  } = params;

  const schema: ArticleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  if (description) schema.description = description;
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (images && images.length > 0) schema.image = images;
  if (authorName) {
    schema.author = [
      {
        "@type": "Person",
        name: authorName,
      },
    ];
  }
  if (publisherName) {
    schema.publisher = {
      "@type": "Organization",
      name: publisherName,
      ...(publisherLogo && { logo: publisherLogo }),
    };
  }

  return schema;
}

/**
 * Convert schema object to JSON-LD string
 */
export function schemaToJsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema);
}

/**
 * Common breadcrumb generators
 */
export const breadcrumbs = {
  home: (siteName: string, homeUrl: string) =>
    generateBreadcrumbSchema({
      items: [{ name: siteName, url: homeUrl }],
    }),

  page: (siteName: string, siteUrl: string, pageTitle: string, pageSlug: string) =>
    generateBreadcrumbSchema({
      items: [
        { name: siteName, url: siteUrl },
        { name: pageTitle, url: pageSlug ? `${siteUrl}/${pageSlug}` : siteUrl },
      ],
    }),

  job: (siteName: string, siteUrl: string, jobTitle: string, jobSlug: string) =>
    generateBreadcrumbSchema({
      items: [
        { name: siteName, url: siteUrl },
        { name: "İlanlar", url: `${siteUrl}/ilanlar` },
        { name: jobTitle, url: `${siteUrl}/ilanlar/${jobSlug}` },
      ],
    }),
};
