import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { postComment } from "@/db/schema";
import { fromDbTimestamp } from "@/db/timestamp";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { COMMENT_STATUSES, type CommentStatus } from "@/lib/blog";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const data = await req.json().catch(() => null);
  const status = typeof data?.status === "string" ? data.status : null;
  if (!status || !(COMMENT_STATUSES as readonly string[]).includes(status)) {
    return Response.json({ error: "Status inválido" }, { status: 400 });
  }
  const [comment] = await db
    .update(postComment)
    .set({ status: status as CommentStatus })
    .where(eq(postComment.id, id))
    .returning();
  if (!comment) throw new Error(`PostComment ${id} not found`);
  return Response.json({ ...comment, createdAt: fromDbTimestamp(comment.createdAt) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(postComment).where(eq(postComment.id, id));
  return Response.json({ ok: true });
}
