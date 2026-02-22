/**
 * StructuredData Component
 *
 * Renders JSON-LD structured data for SEO.
 * Supports WebSite, Organization, BreadcrumbList, and Article schemas.
 * 
 * SECURITY: Uses children instead of dangerouslySetInnerHTML to prevent XSS.
 * The JSON is serialized and placed as text content, which is safe because
 * <script type="application/ld+json"> does not execute JavaScript.
 */
import React from "react";

interface StructuredDataProps {
  /** The schema.org structured data object */
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      data-slot="structured-data"
    >
      {JSON.stringify(data)}
    </script>
  );
}

/**
 * WebSiteSchema Component
 */
export interface WebSiteSchemaProps {
  name: string;
  url: string;
  description?: string;
  alternateName?: string;
}

export function WebSiteSchema({
  name,
  url,
  description,
  alternateName,
}: WebSiteSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(description && { description }),
    ...(alternateName && { alternateName }),
  };

  return <StructuredData data={data} />;
}

/**
 * OrganizationSchema Component
 */
export interface OrganizationSchemaProps {
  name: string;
  url: string;
  description?: string;
  logo?: string;
  sameAs?: string[];
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}

export function OrganizationSchema({
  name,
  url,
  description,
  logo,
  sameAs,
  telephone,
  email,
  address,
}: OrganizationSchemaProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
  };

  if (description) data.description = description;
  if (logo) data.logo = logo;
  if (sameAs && sameAs.length > 0) data.sameAs = sameAs;
  if (telephone || email) {
    data.contactPoint = [
      {
        "@type": "ContactPoint",
        ...(telephone && { telephone }),
        contactType: "customer service",
        ...(email && { email }),
      },
    ];
  }
  if (address) {
    data.address = {
      "@type": "PostalAddress",
      ...address,
    };
  }

  return <StructuredData data={data} />;
}

/**
 * BreadcrumbListSchema Component
 */
export interface BreadcrumbItem {
  name: string;
  url?: string;
}

export interface BreadcrumbListSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbListSchema({ items }: BreadcrumbListSchemaProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };

  return <StructuredData data={data} />;
}

/**
 * ArticleSchema Component
 */
export interface ArticleSchemaProps {
  headline: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  description?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
  images?: string[];
}

export function ArticleSchema({
  headline,
  url,
  datePublished,
  dateModified,
  description,
  authorName,
  publisherName,
  publisherLogo,
  images,
}: ArticleSchemaProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  if (description) data.description = description;
  if (datePublished) data.datePublished = datePublished;
  if (dateModified) data.dateModified = dateModified;
  if (images && images.length > 0) data.image = images;
  if (authorName) {
    data.author = [
      {
        "@type": "Person",
        name: authorName,
      },
    ];
  }
  if (publisherName) {
    data.publisher = {
      "@type": "Organization",
      name: publisherName,
      ...(publisherLogo && { logo: publisherLogo }),
    };
  }

  return <StructuredData data={data} />;
}
