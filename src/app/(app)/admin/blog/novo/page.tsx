import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { PostEditor } from "@/components/blog/post-editor";
import { POST_CATEGORIES } from "@/lib/blog";

export default async function NewPostPage() {
  if (!(await requireBlogAdmin())) redirect("/saldos");
  const topics = await prisma.postTopic.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link href="/admin/blog" className="text-sm text-body-text hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Novo post</h1>
      <PostEditor
        mode="create"
        allTopics={topics}
        initial={{
          title: "",
          excerpt: "",
          content: "",
          coverImageUrl: "",
          category: POST_CATEGORIES[0],
          status: "draft",
          metaTitle: "",
          metaDescription: "",
          topicIds: [],
        }}
      />
    </div>
  );
}
