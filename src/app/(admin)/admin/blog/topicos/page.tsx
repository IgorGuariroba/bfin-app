import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { TopicsManager } from "@/components/blog/topics-manager";

export default async function AdminTopicsPage() {
  if (!(await requireBlogAdmin())) redirect("/saldos");
  const topics = await prisma.postTopic.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Tópicos</h1>
        <p className="mt-1 text-[14px] text-muted">Organize os posts por tema.</p>
      </div>
      <TopicsManager initial={topics.map((t) => ({ id: t.id, name: t.name, slug: t.slug, postCount: t._count.posts }))} />
    </div>
  );
}
