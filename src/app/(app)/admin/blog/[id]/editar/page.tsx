import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { PostEditor } from "@/components/blog/post-editor";
import type { PostCategory, PostStatus } from "@/lib/blog";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) redirect("/saldos");
  const { id } = await params;
  const [post, topics] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: { topics: { select: { id: true } } },
    }),
    prisma.postTopic.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <Link href="/admin/blog" className="text-sm text-body-text hover:text-ink">
        ← Voltar
      </Link>
      <div className="mt-3 mb-8 flex items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Editar post</h1>
        {post.status === "published" && (
          <Link href={`/blog/${post.slug}`} target="_blank" className="text-sm font-medium text-rausch hover:underline">
            Ver publicado ↗
          </Link>
        )}
      </div>
      <PostEditor
        mode="edit"
        allTopics={topics}
        initial={{
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImageUrl: post.coverImageUrl ?? "",
          category: post.category as PostCategory,
          status: post.status as PostStatus,
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
          topicIds: post.topics.map((t) => t.id),
        }}
      />
    </div>
  );
}
