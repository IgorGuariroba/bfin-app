import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post } from "@/db/schema";
import { fromDbTimestamp, fromDbTimestampOrNull, toDbTimestamp } from "@/db/timestamp";
import { attachTopics, setPostTopics } from "@/lib/blog-db";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { POST_CATEGORIES, POST_STATUSES, type PostCategory, type PostStatus } from "@/lib/blog";

function serializePost(row: typeof post.$inferSelect) {
  return {
    ...row,
    publishedAt: fromDbTimestampOrNull(row.publishedAt),
    createdAt: fromDbTimestamp(row.createdAt),
    updatedAt: fromDbTimestamp(row.updatedAt),
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const [row] = await db.select().from(post).where(eq(post.id, id));
  if (!row) return Response.json({ error: "Não encontrado" }, { status: 404 });
  const [withTopics] = await attachTopics([row]);
  return Response.json({ ...serializePost(withTopics), topics: withTopics.topics });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const [existing] = await db.select().from(post).where(eq(post.id, id));
  if (!existing) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const data = await req.json().catch(() => null);
  if (!data) return Response.json({ error: "Body inválido" }, { status: 400 });

  const update: Partial<typeof post.$inferInsert> = { updatedAt: toDbTimestamp(new Date()) };

  if (typeof data.title === "string" && data.title.trim()) update.title = data.title.trim();
  if (typeof data.content === "string") update.content = data.content;
  if (typeof data.excerpt === "string" && data.excerpt.trim()) update.excerpt = data.excerpt.trim();
  if ("coverImageUrl" in data) update.coverImageUrl = data.coverImageUrl?.trim() || null;
  if ("metaTitle" in data) update.metaTitle = data.metaTitle?.trim() || null;
  if ("metaDescription" in data) update.metaDescription = data.metaDescription?.trim() || null;

  if (typeof data.category === "string") {
    if (!(POST_CATEGORIES as readonly string[]).includes(data.category)) {
      return Response.json({ error: "Categoria inválida" }, { status: 400 });
    }
    update.category = data.category as PostCategory;
  }

  if (typeof data.status === "string") {
    if (!(POST_STATUSES as readonly string[]).includes(data.status)) {
      return Response.json({ error: "Status inválido" }, { status: 400 });
    }
    const newStatus = data.status as PostStatus;
    update.status = newStatus;
    if (newStatus === "published" && !existing.publishedAt) {
      update.publishedAt = update.updatedAt;
    }
  }

  let topicIds: string[] | undefined;
  if (Array.isArray(data.topicIds)) {
    topicIds = data.topicIds.filter((s: unknown): s is string => typeof s === "string");
  }

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx.update(post).set(update).where(eq(post.id, id)).returning();
    if (topicIds) await setPostTopics(tx, id, topicIds);
    return row;
  });

  return Response.json(serializePost(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(post).where(eq(post.id, id));
  return Response.json({ ok: true });
}
