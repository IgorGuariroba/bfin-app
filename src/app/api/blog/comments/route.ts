import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/drizzle";
import { post, postComment } from "@/db/schema";
import { checkRateLimit, COMMENT_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const limit = checkRateLimit(`comment:${session.user.id}`, COMMENT_RATE_LIMIT);
  if (!limit.allowed) {
    return Response.json(
      { error: "Muitos comentários em sequência. Tente novamente mais tarde." },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } }
    );
  }

  const data = await req.json().catch(() => null);
  const postId = typeof data?.postId === "string" ? data.postId : null;
  const body = typeof data?.body === "string" ? data.body.trim() : "";

  if (!postId || body.length < 3 || body.length > 2000) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [found] = await db
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.id, postId), eq(post.status, "published")));
  if (!found) return Response.json({ error: "Post não encontrado" }, { status: 404 });

  const [comment] = await db
    .insert(postComment)
    .values({ id: crypto.randomUUID(), postId, userId: session.user.id, body, status: "pending" })
    .returning();

  return Response.json({ id: comment.id, status: comment.status }, { status: 201 });
}
