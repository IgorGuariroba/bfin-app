import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { findCategoryBySlug, postExcerpt, readingMinutes } from "@/lib/blog";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category} · Blog bfin`,
    description: `Artigos sobre ${category.toLowerCase()} no blog do bfin.`,
    alternates: { canonical: `/blog/categoria/${slug}` },
  };
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);
  if (!category) notFound();

  const posts = await prisma.post.findMany({
    where: { status: "published", category },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <Link href="/blog" className="text-sm text-body-text hover:text-ink">
          ← Todas as categorias
        </Link>
        <h1 className="mt-4 text-[28px] font-bold tracking-tight text-ink md:text-[32px]">
          {category}
        </h1>
        <p className="mt-2 text-body-text">{posts.length} {posts.length === 1 ? "artigo" : "artigos"}</p>

        {posts.length === 0 ? (
          <p className="mt-12 text-body-text">Nenhum post nessa categoria ainda.</p>
        ) : (
          <ul className="mt-12 space-y-8">
            {posts.map((p) => (
              <li key={p.id} className="border-b border-hairline-soft pb-8">
                <h2 className="text-xl font-bold tracking-tight">
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
