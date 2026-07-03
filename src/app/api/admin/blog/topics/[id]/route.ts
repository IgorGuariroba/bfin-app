import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { postTopic } from "@/db/schema";
import { requireBlogAdmin } from "@/lib/blog-admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(postTopic).where(eq(postTopic.id, id));
  return Response.json({ ok: true });
}
