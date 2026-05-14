import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";
import { POST_CATEGORIES, slugify, type PostCategory } from "@/lib/blog";

export async function GET() {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } }, topics: { select: { id: true, name: true } } },
  });
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

  const baseSlug = slugify(title) || "post";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.post.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const post = await prisma.post.create({
    data: {
      slug,
      title,
      excerpt,
      content,
      coverImageUrl,
      category: category as PostCategory,
      status: "draft",
      metaTitle,
      metaDescription,
      authorId: session.user!.id!,
      topics: { connect: topicIds.map((id) => ({ id })) },
    },
  });

  return Response.json(post, { status: 201 });
}

