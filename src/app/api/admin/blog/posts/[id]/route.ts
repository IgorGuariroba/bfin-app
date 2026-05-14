import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { POST_CATEGORIES, POST_STATUSES, type PostCategory, type PostStatus } from "@/lib/blog";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { topics: { select: { id: true, name: true, slug: true } } },
  });
  if (!post) return Response.json({ error: "Não encontrado" }, { status: 404 });
  return Response.json(post);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const data = await req.json().catch(() => null);
  if (!data) return Response.json({ error: "Body inválido" }, { status: 400 });

  const update: Record<string, unknown> = {};

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
      update.publishedAt = new Date();
    }
  }

  let topicConnect: { id: string }[] | undefined;
  if (Array.isArray(data.topicIds)) {
    topicConnect = data.topicIds
      .filter((s: unknown): s is string => typeof s === "string")
      .map((id: string) => ({ id }));
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...update,
      ...(topicConnect ? { topics: { set: topicConnect } } : {}),
    },
  });

  return Response.json(post);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return Response.json({ ok: true });
}
