import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappContact, whatsappConversation, whatsappMessage } from "@/db/schema";
import { fromDbTimestamp } from "@/adapters/drizzle/timestamp";
import { requireAdminOr403 } from "@/lib/admin-route";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  const [row] = await db
    .select({
      id: whatsappConversation.id,
      status: whatsappConversation.status,
      lastMessageAt: whatsappConversation.lastMessageAt,
      contactId: whatsappContact.id,
      contactPhone: whatsappContact.phone,
      contactName: whatsappContact.name,
      contactCreatedAt: whatsappContact.createdAt,
    })
    .from(whatsappConversation)
    .innerJoin(whatsappContact, eq(whatsappConversation.contactId, whatsappContact.id))
    .where(eq(whatsappConversation.id, id));

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const messages = await db
    .select()
    .from(whatsappMessage)
    .where(eq(whatsappMessage.conversationId, id))
    .orderBy(desc(whatsappMessage.createdAt))
    .limit(500);
  messages.reverse();

  return Response.json({
    id: row.id,
    status: row.status,
    lastMessageAt: fromDbTimestamp(row.lastMessageAt),
    contact: {
      id: row.contactId,
      phone: row.contactPhone,
      name: row.contactName,
      createdAt: fromDbTimestamp(row.contactCreatedAt),
    },
    messages: messages.map((m) => ({
      id: m.id,
      direction: m.direction,
      sender: m.sender,
      body: m.body,
      createdAt: fromDbTimestamp(m.createdAt),
    })),
  });
}
