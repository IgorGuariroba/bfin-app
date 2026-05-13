import "server-only";
import { prisma } from "@/lib/prisma";
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
  const contact = await prisma.whatsappContact.upsert({
    where: { phone },
    update: profileName ? { name: profileName } : {},
    create: { phone, name: profileName ?? null },
  });

  const existing = await prisma.whatsappConversation.findFirst({
    where: { contactId: contact.id },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const reopened =
      existing.status === "closed"
        ? await prisma.whatsappConversation.update({
            where: { id: existing.id },
            data: { status: "bot", lastMessageAt: new Date() },
          })
        : existing;
    const messageCount = await prisma.whatsappMessage.count({
      where: { conversationId: reopened.id },
    });
    return {
      id: reopened.id,
      contactId: contact.id,
      status: reopened.status,
      messageCount,
    };
  }

  const created = await prisma.whatsappConversation.create({
    data: { contactId: contact.id, status: "bot" },
  });
  return { id: created.id, contactId: contact.id, status: "bot", messageCount: 0 };
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
    await prisma.whatsappMessage.create({
      data: {
        conversationId,
        direction: "inbound",
        sender: "contact",
        body,
        wamid: message.wamid,
      },
    });
    await prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
    return { duplicate: false };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
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
  await prisma.whatsappMessage.create({
    data: { conversationId, direction: "outbound", sender, body, wamid: wamid ?? null },
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
  await prisma.whatsappConversation.update({
    where: { id: conversationId },
    data: { status },
  });
}

async function handleDelete(conversationId: string, contactId: string, to: string): Promise<void> {
  await sendText(to, DELETE_CONFIRMED_TEXT);
  await prisma.whatsappContact.delete({ where: { id: contactId } });
}

export async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const conv = await upsertContactAndConversation(message.from, message.profileName);

  const persisted = await persistInbound(conv.id, message);
  if (persisted.duplicate) return;

  if (conv.status === "human") return;

  if (await isRateLimited(conv.id)) {
    if (conv.status !== "rate_limited") {
      await setStatus(conv.id, "rate_limited");
      const { wamid } = await sendText(message.from, RATE_LIMITED_TEXT);
      await persistOutbound(conv.id, RATE_LIMITED_TEXT, "bot", wamid);
    }
    return;
  }

  if (conv.status === "waiting_human") return;

  if (conv.messageCount === 0) {
    await sendMenu(message.from, conv.id, WELCOME_TEXT);
    return;
  }

  if (message.kind === "text" && message.text && isDeleteKeyword(message.text)) {
    await handleDelete(conv.id, conv.contactId, message.from);
    return;
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
    return;
  }

  await respondIntent(message.from, conv.id, intent);
  if (isHandoffIntent(intent)) {
    await setStatus(conv.id, "waiting_human");
  }
}
