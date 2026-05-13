import "server-only";
import { prisma } from "@/lib/prisma";
import { requireAdminOr403 } from "@/lib/admin-route";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  const conversation = await prisma.whatsappConversation.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, phone: true, name: true, createdAt: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 500 },
    },
  });

  if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });
  conversation.messages.reverse();
  return Response.json(conversation);
}
