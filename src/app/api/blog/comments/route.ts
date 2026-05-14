import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await req.json().catch(() => null);
  const postId = typeof data?.postId === "string" ? data.postId : null;
  const body = typeof data?.body === "string" ? data.body.trim() : "";

  if (!postId || body.length < 3 || body.length > 2000) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, status: "published" },
    select: { id: true },
  });
  if (!post) return Response.json({ error: "Post não encontrado" }, { status: 404 });

  const comment = await prisma.postComment.create({
    data: { postId, userId: session.user.id, body, status: "pending" },
  });

  return Response.json({ id: comment.id, status: comment.status }, { status: 201 });
}
