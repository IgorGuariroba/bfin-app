import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { PostEditor } from "@/components/blog/post-editor";
import { POST_CATEGORIES } from "@/lib/blog";
import { AdminBackLink } from "@/components/admin/admin-back-link";

export default async function NewPostPage() {
  if (!(await requireBlogAdmin())) redirect("/saldos");
  const topics = await prisma.postTopic.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-24 md:px-6">
      <AdminBackLink href="/admin/blog" />
      <h1 className="mb-6 text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Novo post</h1>
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
