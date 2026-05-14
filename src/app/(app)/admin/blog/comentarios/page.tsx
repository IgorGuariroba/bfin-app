import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { CommentsModeration } from "@/components/blog/comments-moderation";
import { Button } from "@/components/ui/button";
import { AdminBackLink } from "@/components/admin/admin-back-link";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await requireBlogAdmin())) redirect("/saldos");
  const { status } = await searchParams;
  const filter = status === "approved" || status === "rejected" ? status : "pending";

  const comments = await prisma.postComment.findMany({
    where: { status: filter },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      post: { select: { title: true, slug: true } },
    },
  });

  const tabs = [
    { value: "pending", label: "Pendentes" },
    { value: "approved", label: "Aprovados" },
    { value: "rejected", label: "Rejeitados" },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-24 md:px-6">
      <AdminBackLink href="/admin/blog" />
      <h1 className="mb-6 text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Comentários</h1>

      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.value}
            asChild
            size="sm"
            variant={filter === t.value ? "default" : "outline"}
          >
            <Link href={`/admin/blog/comentarios?status=${t.value}`}>{t.label}</Link>
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
