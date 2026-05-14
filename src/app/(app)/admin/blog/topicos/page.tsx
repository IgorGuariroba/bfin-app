import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { TopicsManager } from "@/components/blog/topics-manager";
import { AdminBackLink } from "@/components/admin/admin-back-link";

export default async function AdminTopicsPage() {
  if (!(await requireBlogAdmin())) redirect("/saldos");
  const topics = await prisma.postTopic.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-24 md:px-6">
      <AdminBackLink href="/admin/blog" />
      <h1 className="mb-6 text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Tópicos</h1>
      <TopicsManager initial={topics.map((t) => ({ id: t.id, name: t.name, slug: t.slug, postCount: t._count.posts }))} />
    </div>
  );
}
