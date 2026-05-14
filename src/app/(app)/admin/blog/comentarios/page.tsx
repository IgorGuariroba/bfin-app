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
    <div className="mx-auto max-w-4xl p-6">
      <Link href="/admin/blog" className="text-sm text-body-text hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Comentários</h1>

      <nav className="mb-6 flex gap-2 text-sm">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/blog/comentarios?status=${s}`}
            className={`rounded-full border px-3 py-1 ${
              filter === s ? "border-ink bg-ink text-canvas" : "border-hairline text-ink"
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
