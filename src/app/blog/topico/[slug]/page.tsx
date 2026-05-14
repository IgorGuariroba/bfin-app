import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { postExcerpt, readingMinutes } from "@/lib/blog";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = await prisma.postTopic.findUnique({ where: { slug } });
  if (!topic) return {};
  return {
    title: `#${topic.name} · Blog bfin`,
    description: `Posts marcados com ${topic.name}.`,
    alternates: { canonical: `/blog/topico/${slug}` },
  };
}

export default async function BlogTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await prisma.postTopic.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          content: true,
          publishedAt: true,
          category: true,
          author: { select: { name: true } },
        },
      },
    },
  });
  if (!topic) notFound();

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
        <p className="mt-2 text-body-text">{topic.posts.length} {topic.posts.length === 1 ? "post" : "posts"}</p>

        {topic.posts.length === 0 ? (
          <p className="mt-12 text-body-text">Nenhum post com esse tópico ainda.</p>
        ) : (
          <ul className="mt-12 space-y-8">
            {topic.posts.map((p) => (
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
