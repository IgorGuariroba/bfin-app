import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/precos`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/ajuda`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
  ];
}
