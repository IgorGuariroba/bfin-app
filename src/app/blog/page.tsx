import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post, user } from "@/db/schema";
import { fromDbTimestampOrNull } from "@/adapters/drizzle/timestamp";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { POST_CATEGORIES, categorySlug, postExcerpt, readingMinutes } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog · bfin",
  description: "Educação financeira, dicas práticas, novidades do produto e leituras de mercado.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog · bfin",
    description: "Educação financeira, dicas práticas, novidades do produto e leituras de mercado.",
    url: "/blog",
  },
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default async function BlogIndexPage() {
  const rows = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      category: post.category,
      publishedAt: post.publishedAt,
      authorName: user.name,
    })
    .from(post)
    .innerJoin(user, eq(post.authorId, user.id))
    .where(eq(post.status, "published"))
    .orderBy(desc(post.publishedAt));
  const posts = rows.map((p) => ({
    ...p,
    publishedAt: fromDbTimestampOrNull(p.publishedAt),
    author: { name: p.authorName },
  }));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />
      <main>
        <section className="border-b border-hairline-soft">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20 text-center">
            <span className="inline-flex items-center rounded-full border border-hairline bg-canvas px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.32px] text-ink">
              Blog
            </span>
            <h1 className="mt-6 text-[28px] font-bold leading-[1.1] tracking-tight text-ink md:text-[32px]">
              Aprenda a cuidar do seu <span className="text-rausch">dinheiro</span>
            </h1>
            <p className="mt-4 text-base text-body-text">
              Conteúdo prático sobre finanças pessoais e novidades do bfin.
            </p>
          </div>
        </section>

        <section className="border-b border-hairline-soft py-8">
          <div className="mx-auto max-w-5xl px-6">
            <nav className="flex flex-wrap gap-2 text-sm">
              <Link href="/blog" className="inline-flex h-9 items-center rounded-full border border-ink bg-ink px-4 font-medium text-canvas">
                Todas
              </Link>
              {POST_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/blog/categoria/${categorySlug(c)}`}
                  className="inline-flex h-9 items-center rounded-full border border-hairline bg-canvas px-4 font-medium text-ink hover:bg-surface-soft"
                >
                  {c}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            {posts.length === 0 ? (
              <p className="text-center text-body-text">Nenhum post publicado ainda.</p>
            ) : (
              <ul className="grid gap-8 md:grid-cols-2">
                {posts.map((p) => (
                  <li key={p.id} className="rounded-[14px] border border-hairline bg-canvas overflow-hidden">
                    {p.coverImageUrl && (
                      <Link href={`/blog/${p.slug}`} className="block aspect-[16/9] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.coverImageUrl} alt="" className="size-full object-cover" />
                      </Link>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-body-text">
                        <Link
                          href={`/blog/categoria/${categorySlug(p.category as (typeof POST_CATEGORIES)[number])}`}
                          className="font-semibold text-rausch hover:underline"
                        >
                          {p.category}
                        </Link>
                        <span>·</span>
                        <span>{readingMinutes(p.content)} min</span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold tracking-tight">
                        <Link href={`/blog/${p.slug}`} className="hover:text-rausch">
                          {p.title}
                        </Link>
                      </h2>
                      <p className="mt-2 text-sm text-body-text">{postExcerpt(p)}</p>
                      <div className="mt-4 text-xs text-body-text">
                        {p.author.name} · {p.publishedAt ? dateFmt.format(p.publishedAt) : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
