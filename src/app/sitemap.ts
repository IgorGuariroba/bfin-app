import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";
import { POST_CATEGORIES, categorySlug } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const posts = await prisma.post.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/precos`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/ajuda`, lastModified: now, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/sobre`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contato`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE_URL}/privacidade`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${SITE_URL}/termos`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${SITE_URL}/blog`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    ...POST_CATEGORIES.map((c) => ({
      url: `${SITE_URL}/blog/categoria/${categorySlug(c)}`,
      lastModified: now,
      priority: 0.5,
      changeFrequency: "weekly" as const,
    })),
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
  ];
}
