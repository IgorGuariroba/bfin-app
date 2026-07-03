import "server-only";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappContact, whatsappConversation, whatsappMessage } from "@/db/schema";
import { toDbTimestamp } from "@/adapters/drizzle/timestamp";
import { isUniqueViolation } from "@/lib/db-errors";
import { sendListMenu, sendText } from "@/lib/whatsapp/client";
import {
  DELETE_CONFIRMED_TEXT,
  FALLBACK_TEXT,
  MENU_ROWS,
  RATE_LIMITED_TEXT,
  STATIC_RESPONSES,
  WELCOME_TEXT,
  detectIntent,
  isDeleteKeyword,
  isHandoffIntent,
  priceText,
  type IntentId,
} from "@/lib/whatsapp/intents";
import { isRateLimited } from "@/lib/whatsapp/throttle";

export type IncomingMessage = {
  wamid: string;
  from: string;
  profileName?: string;
  kind: "text" | "list_reply" | "button_reply" | "unknown";
  text?: string;
  replyId?: string;
};

type Conversation = {
  id: string;
  contactId: string;
  status: string;
  messageCount: number;
};

async function upsertContactAndConversation(
  phone: string,
  profileName: string | undefined,
): Promise<Conversation> {
  const [contact] = await db
    .insert(whatsappContact)
    .values({ id: crypto.randomUUID(), phone, name: profileName ?? null })
    .onConflictDoUpdate({
      target: whatsappContact.phone,
      set: profileName ? { name: profileName } : { id: sql`excluded.id` },
    })
    .returning();

  const [conversation] = await db
    .insert(whatsappConversation)
    .values({ id: crypto.randomUUID(), contactId: contact.id, status: "bot" })
    .onConflictDoUpdate({
      target: whatsappConversation.contactId,
      set: { id: sql`excluded.id` },
    })
    .returning();

  if (conversation.status === "closed") {
    await db
      .update(whatsappConversation)
      .set({ status: "bot", lastMessageAt: toDbTimestamp(new Date()) })
      .where(eq(whatsappConversation.id, conversation.id));
    conversation.status = "bot";
  }

  const [{ n: messageCount }] = await db
    .select({ n: count() })
    .from(whatsappMessage)
    .where(eq(whatsappMessage.conversationId, conversation.id));

  return {
    id: conversation.id,
    contactId: contact.id,
    status: conversation.status,
    messageCount,
  };
}

async function persistInbound(
  conversationId: string,
  message: IncomingMessage,
): Promise<{ duplicate: boolean }> {
  const body =
    message.kind === "text"
      ? message.text ?? ""
      : message.kind === "list_reply" || message.kind === "button_reply"
        ? `[${message.kind}] ${message.replyId ?? ""} ${message.text ?? ""}`.trim()
        : "[unknown]";

  try {
    await db.insert(whatsappMessage).values({
      id: crypto.randomUUID(),
      conversationId,
      direction: "inbound",
      sender: "contact",
      body,
      wamid: message.wamid,
    });
    await db
      .update(whatsappConversation)
      .set({ lastMessageAt: toDbTimestamp(new Date()) })
      .where(eq(whatsappConversation.id, conversationId));
    return { duplicate: false };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { duplicate: true };
    }
    throw err;
  }
}

async function persistOutbound(
  conversationId: string,
  body: string,
  sender: "bot" | "admin",
  wamid: string | undefined,
): Promise<void> {
  await db.insert(whatsappMessage).values({
    id: crypto.randomUUID(),
    conversationId,
    direction: "outbound",
    sender,
    body,
    wamid: wamid ?? null,
  });
}

async function sendMenu(to: string, conversationId: string, intro: string): Promise<void> {
  const { wamid } = await sendListMenu({
    to,
    bodyText: intro,
    buttonText: "Ver opções",
    sectionTitle: "Dúvidas frequentes",
    rows: MENU_ROWS,
  });
  await persistOutbound(conversationId, `${intro}\n[menu list]`, "bot", wamid);
}

async function respondIntent(to: string, conversationId: string, intent: IntentId): Promise<void> {
  const body = intent === "price" ? await priceText() : STATIC_RESPONSES[intent];
  const { wamid } = await sendText(to, body);
  await persistOutbound(conversationId, body, "bot", wamid);
}

async function setStatus(conversationId: string, status: string): Promise<void> {
  await db
    .update(whatsappConversation)
    .set({ status })
    .where(eq(whatsappConversation.id, conversationId));
}

async function handleDelete(conversationId: string, contactId: string, to: string): Promise<void> {
  await db.delete(whatsappContact).where(eq(whatsappContact.id, contactId));
  await sendText(to, DELETE_CONFIRMED_TEXT);
}

export type HandleResult = { deleted: boolean };

export async function handleIncomingMessage(message: IncomingMessage): Promise<HandleResult> {
  const conv = await upsertContactAndConversation(message.from, message.profileName);

  const persisted = await persistInbound(conv.id, message);
  if (persisted.duplicate) return { deleted: false };

  if (message.kind === "text" && message.text && isDeleteKeyword(message.text)) {
    await handleDelete(conv.id, conv.contactId, message.from);
    return { deleted: true };
  }

  if (conv.status === "human") return { deleted: false };

  if (await isRateLimited(conv.id)) {
    if (conv.status !== "rate_limited") {
      await setStatus(conv.id, "rate_limited");
      const { wamid } = await sendText(message.from, RATE_LIMITED_TEXT);
      await persistOutbound(conv.id, RATE_LIMITED_TEXT, "bot", wamid);
    }
    return { deleted: false };
  }

  if (conv.status === "waiting_human") return { deleted: false };

  if (conv.messageCount === 0) {
    await sendMenu(message.from, conv.id, WELCOME_TEXT);
    return { deleted: false };
  }

  let intent: IntentId | null = null;
  if (message.kind === "list_reply" || message.kind === "button_reply") {
    intent = (MENU_ROWS.find((r) => r.id === message.replyId)?.id as IntentId) ?? null;
  } else if (message.kind === "text" && message.text) {
    intent = detectIntent(message.text);
  }

  if (!intent) {
    const { wamid } = await sendText(message.from, FALLBACK_TEXT);
    await persistOutbound(conv.id, FALLBACK_TEXT, "bot", wamid);
    await setStatus(conv.id, "waiting_human");
    return { deleted: false };
  }

  await respondIntent(message.from, conv.id, intent);
  if (isHandoffIntent(intent)) {
    await setStatus(conv.id, "waiting_human");
  }
  return { deleted: false };
}

export async function processBatch(messages: IncomingMessage[]): Promise<void> {
  const byPhone = new Map<string, IncomingMessage[]>();
  for (const m of messages) {
    const list = byPhone.get(m.from) ?? [];
    list.push(m);
    byPhone.set(m.from, list);
  }

  await Promise.all(
    Array.from(byPhone.values()).map(async (group) => {
      let deleted = false;
      for (const msg of group) {
        if (deleted) {
          console.warn("[whatsapp bot] ignorando mensagem pós-APAGAR no mesmo lote", msg.wamid);
          continue;
        }
        try {
          const result = await handleIncomingMessage(msg);
          if (result.deleted) deleted = true;
        } catch (err) {
          console.error("[whatsapp bot] erro processando", msg.wamid, err);
        }
      }
    }),
  );
}
