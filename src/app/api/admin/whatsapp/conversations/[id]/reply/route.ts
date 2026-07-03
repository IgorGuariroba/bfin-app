import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappContact, whatsappConversation, whatsappMessage } from "@/db/schema";
import { fromDbTimestamp, toDbTimestamp } from "@/adapters/drizzle/timestamp";
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

  const [conversation] = await db
    .select({ phone: whatsappContact.phone })
    .from(whatsappConversation)
    .innerJoin(whatsappContact, eq(whatsappConversation.contactId, whatsappContact.id))
    .where(eq(whatsappConversation.id, id));
  if (!conversation) return Response.json({ error: "Not found" }, { status: 404 });

  const [pending] = await db
    .insert(whatsappMessage)
    .values({ id: crypto.randomUUID(), conversationId: id, direction: "outbound", sender: "admin", body, wamid: null })
    .returning();

  let wamid: string | undefined;
  try {
    const result = await sendText(conversation.phone, body);
    wamid = result.wamid;
  } catch {
    await db.delete(whatsappMessage).where(eq(whatsappMessage.id, pending.id)).catch(() => null);
    return Response.json({ error: "Falha ao enviar pelo WhatsApp" }, { status: 502 });
  }

  const [message] = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(whatsappMessage)
      .set({ wamid: wamid ?? null })
      .where(eq(whatsappMessage.id, pending.id))
      .returning();
    await tx
      .update(whatsappConversation)
      .set({ lastMessageAt: toDbTimestamp(new Date()), status: "human" })
      .where(eq(whatsappConversation.id, id));
    return [updated];
  });

  return Response.json({ message: { ...message, createdAt: fromDbTimestamp(message.createdAt) } });
}
