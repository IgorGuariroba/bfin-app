import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { PostEditor } from "@/components/blog/post-editor";
import type { PostCategory, PostStatus } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { AdminBackLink } from "@/components/admin/admin-back-link";

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
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24 md:px-6">
      <AdminBackLink href="/admin/blog" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Editar post</h1>
        {post.status === "published" && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/blog/${post.slug}`} target="_blank">Ver publicado ↗</Link>
          </Button>
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
