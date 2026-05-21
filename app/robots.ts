import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://actuarial-intel.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/auth", "/account", "/api/", "/glossary"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
