import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post, postComment, user } from "@/db/schema";
import { fromDbTimestamp } from "@/adapters/drizzle/timestamp";
import { CommentsModeration } from "@/components/blog/comments-moderation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status === "approved" || status === "rejected" ? status : "pending";

  const [rows, counts] = await Promise.all([
    db
      .select({
        id: postComment.id,
        body: postComment.body,
        createdAt: postComment.createdAt,
        status: postComment.status,
        userName: user.name,
        userEmail: user.email,
        postTitle: post.title,
        postSlug: post.slug,
      })
      .from(postComment)
      .innerJoin(user, eq(postComment.userId, user.id))
      .innerJoin(post, eq(postComment.postId, post.id))
      .where(eq(postComment.status, filter))
      .orderBy(desc(postComment.createdAt)),
    db.select({ status: postComment.status, n: count() }).from(postComment).groupBy(postComment.status),
  ]);
  const comments = rows.map((c) => ({ ...c, createdAt: fromDbTimestamp(c.createdAt) }));

  const countBy = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;

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
          userName: c.userName,
          userEmail: c.userEmail,
          postTitle: c.postTitle,
          postSlug: c.postSlug,
        }))}
      />
    </div>
  );
}
