import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post, postComment, user } from "@/db/schema";
import { fromDbTimestamp, fromDbTimestampOrNull } from "@/adapters/drizzle/timestamp";
import { attachTopics } from "@/lib/blog-db";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Markdown } from "@/components/blog/markdown";
import { categorySlug, postExcerpt, readingMinutes, type PostCategory } from "@/lib/blog";
import { auth } from "@/lib/auth";
import { CommentForm } from "@/components/blog/comment-form";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

async function getPost(slug: string) {
  const [row] = await db
    .select({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      category: post.category,
      status: post.status,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      publishedAt: post.publishedAt,
      authorName: user.name,
    })
    .from(post)
    .innerJoin(user, eq(post.authorId, user.id))
    .where(and(eq(post.slug, slug), inArray(post.status, ["published", "archived"])));
  if (!row) return null;

  const [withTopics] = await attachTopics([row]);
  return {
    ...withTopics,
    publishedAt: fromDbTimestampOrNull(row.publishedAt),
    author: { name: row.authorName },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = post.metaTitle ?? `${post.title} · bfin`;
  const desc = post.metaDescription ?? postExcerpt(post);
  return {
    title,
    description: desc,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description: desc,
      url: `/blog/${post.slug}`,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author.name],
    },
    robots: post.status === "archived" ? { index: false, follow: false } : undefined,
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  if (post.status === "archived") {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <LandingHeader />
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Post arquivado</h1>
          <p className="mt-3 text-body-text">
            Este conteúdo foi arquivado e não está mais disponível.
          </p>
          <Link href="/blog" className="mt-6 inline-block font-medium text-rausch hover:underline">
            ← Voltar ao blog
          </Link>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const [session, commentRows] = await Promise.all([
    auth(),
    db
      .select({ id: postComment.id, body: postComment.body, createdAt: postComment.createdAt, userName: user.name })
      .from(postComment)
      .innerJoin(user, eq(postComment.userId, user.id))
      .where(and(eq(postComment.postId, post.id), eq(postComment.status, "approved")))
      .orderBy(asc(postComment.createdAt)),
  ]);
  const comments = commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: fromDbTimestamp(c.createdAt),
    user: { name: c.userName },
  }));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LandingHeader />
      <main>
        <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
          <Link
            href={`/blog/categoria/${categorySlug(post.category as PostCategory)}`}
            className="text-xs font-semibold uppercase tracking-wide text-rausch hover:underline"
          >
            {post.category}
          </Link>
          <h1 className="mt-3 text-[28px] font-bold leading-[1.1] tracking-tight text-ink md:text-[34px]">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-body-text">{postExcerpt(post)}</p>
          <div className="mt-6 flex items-center gap-3 text-sm text-body-text">
            <span>{post.author.name}</span>
            <span>·</span>
            <span>{post.publishedAt ? dateFmt.format(post.publishedAt) : ""}</span>
            <span>·</span>
            <span>{readingMinutes(post.content)} min de leitura</span>
          </div>

          {post.coverImageUrl && (
            <div className="mt-8 overflow-hidden rounded-[14px] border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImageUrl} alt="" className="w-full" />
            </div>
          )}

          <div className="mt-10">
            <Markdown>{post.content}</Markdown>
          </div>

          {post.topics.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t border-hairline pt-8">
              {post.topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/blog/topico/${t.slug}`}
                  className="rounded-full border border-hairline px-3 py-1 text-xs text-ink hover:bg-surface-soft"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </article>

        <section className="border-t border-hairline-soft py-12">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-xl font-bold tracking-tight">
              Comentários ({comments.length})
            </h2>

            <ul className="mt-6 space-y-6">
              {comments.map((c) => (
                <li key={c.id} className="rounded-[14px] border border-hairline bg-canvas p-5">
                  <div className="text-sm font-semibold text-ink">{c.user.name}</div>
                  <div className="text-xs text-body-text">{dateFmt.format(c.createdAt)}</div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-sm text-body-text">Seja o primeiro a comentar.</li>
              )}
            </ul>

            <div className="mt-8 rounded-[14px] border border-hairline bg-surface-soft p-6">
              {session?.user ? (
                <CommentForm postId={post.id} />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-body-text">
                    Faça login para comentar.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-6 text-[16px] font-medium text-on-primary hover:bg-rausch-active"
                  >
                    Entrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
