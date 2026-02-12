import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://raspro.co.id";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/taper"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
