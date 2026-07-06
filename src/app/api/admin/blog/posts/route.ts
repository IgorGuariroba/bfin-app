import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { post, postTopic, user } from "@/db/schema";
import { fromDbTimestamp, fromDbTimestampOrNull, toDbTimestamp } from "@/db/timestamp";
import { attachTopics, setPostTopics } from "@/lib/blog-db";
import { isUniqueViolation } from "@/lib/db-errors";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { POST_CATEGORIES, POST_STATUSES, slugify, type PostCategory, type PostStatus } from "@/lib/blog";

function serializePost(row: typeof post.$inferSelect) {
  return {
    ...row,
    publishedAt: fromDbTimestampOrNull(row.publishedAt),
    createdAt: fromDbTimestamp(row.createdAt),
    updatedAt: fromDbTimestamp(row.updatedAt),
  };
}

export async function GET() {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const rows = await db
    .select({ post, authorName: user.name })
    .from(post)
    .innerJoin(user, eq(post.authorId, user.id))
    .orderBy(desc(post.updatedAt));
  const withTopics = await attachTopics(rows.map((r) => ({ id: r.post.id, ...r })));
  const posts = withTopics.map((r) => ({
    ...serializePost(r.post),
    author: { name: r.authorName },
    topics: r.topics.map((t) => ({ id: t.id, name: t.name })),
  }));
  return Response.json(posts);
}

export async function POST(req: Request) {
  const session = await requireBlogAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json().catch(() => null);
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const content = typeof data?.content === "string" ? data.content : "";
  const excerpt = typeof data?.excerpt === "string" ? data.excerpt.trim() : "";
  const category = typeof data?.category === "string" ? data.category : "";
  const coverImageUrl = typeof data?.coverImageUrl === "string" && data.coverImageUrl.trim() ? data.coverImageUrl.trim() : null;
  const metaTitle = typeof data?.metaTitle === "string" && data.metaTitle.trim() ? data.metaTitle.trim() : null;
  const metaDescription = typeof data?.metaDescription === "string" && data.metaDescription.trim() ? data.metaDescription.trim() : null;
  const topicIds: string[] = Array.isArray(data?.topicIds) ? data.topicIds.filter((s: unknown) => typeof s === "string") : [];

  if (!title || !content || !excerpt) {
    return Response.json({ error: "Título, resumo e conteúdo são obrigatórios" }, { status: 400 });
  }
  if (!(POST_CATEGORIES as readonly string[]).includes(category)) {
    return Response.json({ error: "Categoria inválida" }, { status: 400 });
  }

  let status: PostStatus = "draft";
  if (typeof data?.status === "string") {
    if (!(POST_STATUSES as readonly string[]).includes(data.status)) {
      return Response.json({ error: "Status inválido" }, { status: 400 });
    }
    status = data.status as PostStatus;
  }

  let validTopicIds: string[] = [];
  if (topicIds.length > 0) {
    const found = await db.select({ id: postTopic.id }).from(postTopic).where(inArray(postTopic.id, topicIds));
    validTopicIds = found.map((t) => t.id);
    if (validTopicIds.length !== topicIds.length) {
      return Response.json({ error: "Um ou mais tópicos não existem" }, { status: 400 });
    }
  }

  const baseSlug = slugify(title) || "post";
  let slug = baseSlug;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const now = toDbTimestamp(new Date());
      const created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(post)
          .values({
            id: crypto.randomUUID(),
            slug,
            title,
            excerpt,
            content,
            coverImageUrl,
            category: category as PostCategory,
            status,
            publishedAt: status === "published" ? now : null,
            metaTitle,
            metaDescription,
            authorId: session.user!.id!,
            updatedAt: now,
          })
          .returning();
        await setPostTopics(tx, row.id, validTopicIds);
        return row;
      });
      return Response.json(serializePost(created), { status: 201 });
    } catch (err) {
      if (isUniqueViolation(err)) {
        slug = `${baseSlug}-${attempt + 1}`;
        continue;
      }
      throw err;
    }
  }
  return Response.json({ error: "Não foi possível gerar slug único" }, { status: 409 });
}
