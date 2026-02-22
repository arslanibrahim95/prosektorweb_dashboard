import { MetadataRoute } from "next";

/**
 * Generate robots.txt for the dashboard
 *
 * Note: This is for the dashboard itself. In production,
 * each published site should have its own robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
    ],
    sitemap: "/sitemap.xml",
  };
}
