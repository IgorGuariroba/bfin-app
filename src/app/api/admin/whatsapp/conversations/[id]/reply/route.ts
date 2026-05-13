import "server-only";
import { prisma } from "@/lib/prisma";
import { requireAdminOr403 } from "@/lib/admin-route";
import { sendText } from "@/lib/whatsapp/client";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  const data = await request.json().catch(() => null);
  const body = typeof data?.body === "string" ? data.body.trim() : "";
  if (!body) return Response.json({ error: "Mensagem vazia" }, { status: 400 });
  if (body.length > 4096) return Response.json({ error: "Mensagem muito longa" }, { status: 400 });

  const conversation = await prisma.whatsappConversation.findUnique({
    where: { id },
    include: { contact: { select: { phone: true } } },
  });
  if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });

  const { wamid } = await sendText(conversation.contact.phone, body);

  const message = await prisma.whatsappMessage.create({
    data: {
      conversationId: id,
      direction: "outbound",
      sender: "admin",
      body,
      wamid: wamid ?? null,
    },
  });

  await prisma.whatsappConversation.update({
    where: { id },
    data: { lastMessageAt: new Date(), status: "human" },
  });

  return Response.json({ message });
}
