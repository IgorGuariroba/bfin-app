import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post, user } from "@/db/schema";
import { fromDbTimestampOrNull } from "@/adapters/drizzle/timestamp";
import { SITE_URL } from "@/lib/site-url";
import { postExcerpt } from "@/lib/blog";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      publishedAt: post.publishedAt,
      authorName: user.name,
    })
    .from(post)
    .innerJoin(user, eq(post.authorId, user.id))
    .where(eq(post.status, "published"))
    .orderBy(desc(post.publishedAt))
    .limit(50);

  const items = rows
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`;
      const publishedAt = fromDbTimestampOrNull(p.publishedAt);
      const pubDate = publishedAt?.toUTCString() ?? new Date().toUTCString();
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@bfincont.com.br (${escapeXml(p.authorName)})</author>
      <description>${escapeXml(postExcerpt(p))}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog bfin</title>
    <link>${SITE_URL}/blog</link>
    <description>Educação financeira e novidades do bfin.</description>
    <language>pt-BR</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
