import Link from "next/link";
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
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <Link href="/admin/blog" className="text-sm text-body-text hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="mt-3 mb-8 text-[28px] font-bold tracking-tight text-ink">Tópicos</h1>
      <TopicsManager initial={topics.map((t) => ({ id: t.id, name: t.name, slug: t.slug, postCount: t._count.posts }))} />
    </div>
  );
}
