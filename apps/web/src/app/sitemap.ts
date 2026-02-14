import { MetadataRoute } from "next";

/**
 * Generate sitemap.xml for the dashboard
 *
 * Note: This is a basic sitemap for the dashboard itself.
 * In production, each published site should have its own sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://prosektorweb.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
