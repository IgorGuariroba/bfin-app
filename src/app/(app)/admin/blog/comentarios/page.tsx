import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { CommentsModeration } from "@/components/blog/comments-moderation";

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

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <Link href="/admin/blog" className="text-sm text-body-text hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="mt-3 mb-8 text-[28px] font-bold tracking-tight text-ink">Comentários</h1>

      <nav className="mb-8 flex flex-wrap gap-2 text-sm">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/blog/comentarios?status=${s}`}
            className={`inline-flex h-9 items-center rounded-full border px-4 font-medium transition-colors ${
              filter === s ? "border-ink bg-ink text-canvas" : "border-hairline text-ink hover:bg-surface-soft"
            }`}
          >
            {s === "pending" ? "Pendentes" : s === "approved" ? "Aprovados" : "Rejeitados"}
          </Link>
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
