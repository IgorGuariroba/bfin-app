import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { CommentsModeration } from "@/components/blog/comments-moderation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await requireBlogAdmin())) redirect("/saldos");
  const { status } = await searchParams;
  const filter = status === "approved" || status === "rejected" ? status : "pending";

  const [comments, counts] = await Promise.all([
    prisma.postComment.findMany({
      where: { status: filter },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        post: { select: { title: true, slug: true } },
      },
    }),
    prisma.postComment.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countBy = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  const tabs = [
    { value: "pending", label: "Pendentes", count: countBy("pending") },
    { value: "approved", label: "Aprovados", count: countBy("approved") },
    { value: "rejected", label: "Rejeitados", count: countBy("rejected") },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Comentários</h1>
        <p className="mt-1 text-[14px] text-muted">Modere as conversas dos posts.</p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.value}
            asChild
            size="sm"
            variant={filter === t.value ? "default" : "outline"}
          >
            <Link href={`/admin/blog/comentarios?status=${t.value}`}>
              {t.label}
              <Badge variant={filter === t.value ? "secondary" : "outline"} className="ml-2 h-5 px-1.5">
                {t.count}
              </Badge>
            </Link>
          </Button>
        ))}
      </nav>

      <CommentsModeration
        comments={comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          status: c.status,
          userName: c.user.name,
          userEmail: c.user.email,
          postTitle: c.post.title,
          postSlug: c.post.slug,
        }))}
      />
    </div>
  );
}
