import "server-only";
import { prisma } from "@/lib/prisma";
import { requireAdminOr403 } from "@/lib/admin-route";

const ALLOWED = new Set(["bot", "waiting_human", "human", "closed"]);

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  const data = await request.json().catch(() => null);
  const status = typeof data?.status === "string" ? data.status : "";
  if (!ALLOWED.has(status)) return Response.json({ error: "Status inválido" }, { status: 400 });

  const conversation = await prisma.whatsappConversation.update({
    where: { id },
    data: { status },
  });
  return Response.json(conversation);
}
