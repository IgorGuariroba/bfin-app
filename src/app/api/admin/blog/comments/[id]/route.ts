import { prisma } from "@/lib/prisma";
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
  const comment = await prisma.postComment.update({
    where: { id },
    data: { status: status as CommentStatus },
  });
  return Response.json(comment);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireBlogAdmin())) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.postComment.deleteMany({ where: { id } });
  return Response.json({ ok: true });
}
