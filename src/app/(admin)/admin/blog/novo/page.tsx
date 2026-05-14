import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/blog/post-editor";
import { POST_CATEGORIES } from "@/lib/blog";

export default async function NewPostPage() {
  const topics = await prisma.postTopic.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Novo post</h1>
        <p className="mt-1 text-[14px] text-muted">Crie um rascunho ou publique imediatamente.</p>
      </div>
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
