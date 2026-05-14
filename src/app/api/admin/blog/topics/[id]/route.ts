import { prisma } from "@/lib/prisma";
import { requireBlogAdmin } from "@/lib/blog-admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.postTopic.deleteMany({ where: { id } });
  return Response.json({ ok: true });
}
