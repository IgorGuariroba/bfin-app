import "server-only";
import { NextRequest } from "next/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappContact, whatsappConversation, whatsappMessage } from "@/db/schema";
import { fromDbTimestamp } from "@/adapters/drizzle/timestamp";
import { requireAdminOr403 } from "@/lib/admin-route";

const VALID_STATUS = new Set(["bot", "waiting_human", "human", "closed", "rate_limited"]);

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const status = request.nextUrl.searchParams.get("status");
  const whereClause =
    status && VALID_STATUS.has(status) ? eq(whatsappConversation.status, status) : undefined;

  const conversations = await db
    .select({
      id: whatsappConversation.id,
      status: whatsappConversation.status,
      lastMessageAt: whatsappConversation.lastMessageAt,
      contactId: whatsappContact.id,
      contactPhone: whatsappContact.phone,
      contactName: whatsappContact.name,
    })
    .from(whatsappConversation)
    .innerJoin(whatsappContact, eq(whatsappConversation.contactId, whatsappContact.id))
    .where(whereClause)
    .orderBy(asc(whatsappConversation.status), desc(whatsappConversation.lastMessageAt))
    .limit(200);

  const conversationIds = conversations.map((c) => c.id);
  const lastMessages = conversationIds.length
    ? await db
        .selectDistinctOn([whatsappMessage.conversationId], {
          conversationId: whatsappMessage.conversationId,
          body: whatsappMessage.body,
          direction: whatsappMessage.direction,
          createdAt: whatsappMessage.createdAt,
        })
        .from(whatsappMessage)
        .where(inArray(whatsappMessage.conversationId, conversationIds))
        .orderBy(whatsappMessage.conversationId, desc(whatsappMessage.createdAt))
    : [];
  const lastMessageByConversation = new Map(lastMessages.map((m) => [m.conversationId, m]));

  return Response.json({
    conversations: conversations.map((c) => {
      const lastMessage = lastMessageByConversation.get(c.id);
      return {
        id: c.id,
        status: c.status,
        lastMessageAt: fromDbTimestamp(c.lastMessageAt),
        contact: { id: c.contactId, phone: c.contactPhone, name: c.contactName },
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              direction: lastMessage.direction,
              createdAt: fromDbTimestamp(lastMessage.createdAt),
            }
          : null,
      };
    }),
  });
}
