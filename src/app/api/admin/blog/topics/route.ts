import { asc } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { postTopic } from "@/db/schema";
import { countPostsByTopic } from "@/lib/blog-db";
import { isUniqueViolation } from "@/lib/db-errors";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { slugify } from "@/lib/blog";

export async function GET() {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const [topics, postCounts] = await Promise.all([
    db.select().from(postTopic).orderBy(asc(postTopic.name)),
    countPostsByTopic(),
  ]);
  return Response.json(
    topics.map((t) => ({ ...t, _count: { posts: postCounts.get(t.id) ?? 0 } }))
  );
}

export async function POST(req: Request) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const data = await req.json().catch(() => null);
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  if (!name) return Response.json({ error: "Nome obrigatório" }, { status: 400 });

  const baseSlug = slugify(name) || "topico";
  let slug = baseSlug;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const [topic] = await db
        .insert(postTopic)
        .values({ id: crypto.randomUUID(), name, slug })
        .returning();
      return Response.json(topic, { status: 201 });
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
