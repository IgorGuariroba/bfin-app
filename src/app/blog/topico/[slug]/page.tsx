import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post, postTopic, postTopics, user } from "@/db/schema";
import { fromDbTimestampOrNull } from "@/db/timestamp";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { postExcerpt, readingMinutes } from "@/lib/blog";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

async function getTopic(slug: string) {
  const [row] = await db.select().from(postTopic).where(eq(postTopic.slug, slug));
  return row ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) return {};
  return {
    title: `#${topic.name} · Blog bfin`,
    description: `Posts marcados com ${topic.name}.`,
    alternates: { canonical: `/blog/topico/${slug}` },
  };
}

export default async function BlogTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) notFound();

  const rows = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      publishedAt: post.publishedAt,
      category: post.category,
      authorName: user.name,
    })
    .from(postTopics)
    .innerJoin(post, eq(post.id, postTopics.a))
    .innerJoin(user, eq(post.authorId, user.id))
    .where(and(eq(postTopics.b, topic.id), eq(post.status, "published")))
    .orderBy(desc(post.publishedAt));
  const posts = rows.map((p) => ({
    ...p,
    publishedAt: fromDbTimestampOrNull(p.publishedAt),
    author: { name: p.authorName },
  }));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <Link href="/blog" className="text-sm text-body-text hover:text-ink">
          ← Voltar ao blog
        </Link>
        <h1 className="mt-4 text-[28px] font-bold tracking-tight text-ink md:text-[32px]">
          #{topic.name}
        </h1>
        <p className="mt-2 text-body-text">{posts.length} {posts.length === 1 ? "post" : "posts"}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-body-text">Nenhum post com esse tópico ainda.</p>
        ) : (
          <ul className="mt-12 space-y-8">
            {posts.map((p) => (
              <li key={p.id} className="border-b border-hairline-soft pb-8">
                <span className="text-xs font-semibold uppercase tracking-wide text-rausch">{p.category}</span>
                <h2 className="mt-2 text-xl font-bold tracking-tight">
                  <Link href={`/blog/${p.slug}`} className="hover:text-rausch">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-body-text">{postExcerpt(p)}</p>
                <div className="mt-3 text-xs text-body-text">
                  {p.author.name} · {p.publishedAt ? dateFmt.format(p.publishedAt) : ""} · {readingMinutes(p.content)} min
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
