import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { slugify } from "@/lib/blog";

export async function GET() {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const topics = await prisma.postTopic.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
  return Response.json(topics);
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
      const topic = await prisma.postTopic.create({ data: { name, slug } });
      return Response.json(topic, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        slug = `${baseSlug}-${attempt + 1}`;
        continue;
      }
      throw err;
    }
  }
  return Response.json({ error: "Não foi possível gerar slug único" }, { status: 409 });
}
