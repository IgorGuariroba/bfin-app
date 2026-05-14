import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { PostEditor } from "@/components/blog/post-editor";
import type { PostCategory, PostStatus } from "@/lib/blog";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Editar post</h1>
          <p className="mt-1 text-[14px] text-muted">{post.title}</p>
        </div>
        {post.status === "published" && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/blog/${post.slug}`} target="_blank">
              <ExternalLink size={14} />
              Ver publicado
            </Link>
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
