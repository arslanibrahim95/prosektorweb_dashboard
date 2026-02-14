import type { Metadata } from "next";
import type { Site, Page, SEOSettings } from "@prosektor/contracts";

/**
 * Default SEO configuration
 */
export const DEFAULT_SEO: Partial<SEOSettings> = {
  title_template: "%s | %s",
  default_description:
    "ProsektorWeb Dashboard ile OSGB işletmenizi dijital dünyada yönetin.",
  og_image: undefined,
  robots_txt: undefined,
};

/**
 * Generate absolute URL for a given path
 */
export function generateUrl(domain: string, path: string = ""): string {
  const baseUrl = domain.replace(/^\/+|\/+$/g, "");
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  return cleanPath ? `https://${baseUrl}/${cleanPath}` : `https://${baseUrl}`;
}

/**
 * Format title using the title template
 * @example formatTitle("About", "MySite", "%s | %s") => "About | MySite"
 */
export function formatTitle(
  pageTitle: string,
  siteName: string,
  template = "%s | %s"
): string {
  const resolvedTemplate = template ?? "%s | %s";
  return resolvedTemplate
    .replace("%s", pageTitle)
    .replace("%s", siteName);
}

/**
 * Generate Open Graph images array
 */
export function generateOgImages(
  imageUrl?: string,
  siteName?: string
): NonNullable<Metadata["openGraph"]>["images"] {
  if (!imageUrl) return [];

  return [
    {
      url: imageUrl,
      width: 1200,
      height: 630,
      alt: siteName ?? "Open Graph image",
    },
  ];
}

/**
 * Generate metadata for a site
 */
export function createSiteMetadata(
  site: Site,
  seoSettings?: SEOSettings
): Metadata {
  const settings = { ...DEFAULT_SEO, ...seoSettings };
  const domain = site.primary_domain ?? "prosektorweb.com";
  const siteUrl = generateUrl(domain);

  const title = formatTitle(site.name, site.name, settings.title_template);
  const description = settings.default_description ?? "";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: siteUrl,
      title,
      description,
      siteName: site.name,
      images: generateOgImages(settings.og_image, site.name),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: settings.og_image ? [settings.og_image] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

/**
 * Generate metadata for a page with site-level fallbacks
 */
export function createPageMetadata(
  site: Site,
  page: Page,
  seoSettings?: SEOSettings
): Metadata {
  const settings = { ...DEFAULT_SEO, ...seoSettings };
  const domain = site.primary_domain ?? "prosektorweb.com";
  const pageUrl = page.slug ? generateUrl(domain, page.slug) : generateUrl(domain);

  // Page SEO takes precedence over site defaults
  const pageTitle = page.seo?.title ?? page.title;
  const pageDescription = page.seo?.description ?? settings.default_description ?? "";
  const pageOgImage = page.seo?.og_image ?? settings.og_image;

  const title = formatTitle(pageTitle, site.name, settings.title_template);

  return {
    title,
    description: pageDescription,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: pageUrl,
      title,
      description: pageDescription,
      siteName: site.name,
      images: generateOgImages(pageOgImage, site.name),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: pageDescription,
      images: pageOgImage ? [pageOgImage] : [],
    },
    robots: {
      index: page.status === "published",
      follow: true,
      googleBot: {
        index: page.status === "published",
        follow: true,
      },
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

/**
 * Generate metadata for job posting pages
 */
export function createJobMetadata(
  site: Site,
  jobTitle: string,
  jobLocation?: string,
  seoSettings?: SEOSettings
): Metadata {
  const settings = { ...DEFAULT_SEO, ...seoSettings };
  const domain = site.primary_domain ?? "prosektorweb.com";

  const title = `${jobTitle} İlanı`;
  const description = jobLocation
    ? `${jobTitle} pozisyonu için ${jobLocation} lokasyonunda iş ilanı. Başvuru için tıklayın.`
    : `${jobTitle} pozisyonu için iş ilanı. Başvuru için tıklayın.`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      title,
      description,
      siteName: site.name,
      images: generateOgImages(settings.og_image, site.name),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: settings.og_image ? [settings.og_image] : [],
    },
  };
}
