import { afterEach, describe, it, expect, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappContact, whatsappConversation, whatsappMessage } from "@/db/schema";
import { handleIncomingMessage, type IncomingMessage } from "@/lib/whatsapp/bot";

vi.mock("@/lib/whatsapp/client", () => ({
  sendText: vi.fn(async () => ({ wamid: `out-${crypto.randomUUID()}` })),
  sendListMenu: vi.fn(async () => ({ wamid: `out-${crypto.randomUUID()}` })),
}));

let createdContactIds: string[] = [];

function textMessage(from: string, text: string): IncomingMessage {
  return { wamid: `in-${crypto.randomUUID()}`, from, kind: "text", text };
}

afterEach(async () => {
  vi.clearAllMocks();
  if (createdContactIds.length) {
    await db.delete(whatsappContact).where(inArray(whatsappContact.id, createdContactIds));
    createdContactIds = [];
  }
});

async function conversationFor(phone: string) {
  const [row] = await db.select().from(whatsappContact).where(eq(whatsappContact.phone, phone));
  createdContactIds.push(row.id);
  const [conv] = await db
    .select()
    .from(whatsappConversation)
    .where(eq(whatsappConversation.contactId, row.id));
  return conv;
}

describe("handleIncomingMessage", () => {
  it("primeira mensagem de um contato novo cria conversa e manda o menu de boas-vindas", async () => {
    const phone = `+55119${Math.floor(Math.random() * 1e8)}`;
    await handleIncomingMessage(textMessage(phone, "oi"));

    const conv = await conversationFor(phone);
    expect(conv.status).toBe("bot");

    const messages = await db
      .select()
      .from(whatsappMessage)
      .where(eq(whatsappMessage.conversationId, conv.id));
    expect(messages).toHaveLength(2); // inbound + menu (outbound)
  });

  it("não duplica contato/conversa em mensagens subsequentes do mesmo telefone", async () => {
    const phone = `+55119${Math.floor(Math.random() * 1e8)}`;
    await handleIncomingMessage(textMessage(phone, "oi"));
    await handleIncomingMessage(textMessage(phone, "quero falar com um atendente"));

    const contacts = await db.select().from(whatsappContact).where(eq(whatsappContact.phone, phone));
    expect(contacts).toHaveLength(1);
    createdContactIds.push(contacts[0].id);

    const conv = await conversationFor(phone);
    expect(conv.status).toBe("waiting_human"); // intent "human" é handoff
  });

  it("mensagem duplicada (mesmo wamid) não gera efeito colateral", async () => {
    const phone = `+55119${Math.floor(Math.random() * 1e8)}`;
    const msg = textMessage(phone, "oi");
    await handleIncomingMessage(msg);
    await handleIncomingMessage(msg);

    const conv = await conversationFor(phone);
    const messages = await db
      .select()
      .from(whatsappMessage)
      .where(eq(whatsappMessage.conversationId, conv.id));
    expect(messages).toHaveLength(2); // não dobrou
  });

  it("keyword APAGAR remove contato e conversa (cascade) e confirma a exclusão", async () => {
    const phone = `+55119${Math.floor(Math.random() * 1e8)}`;
    await handleIncomingMessage(textMessage(phone, "oi"));
    const before = await conversationFor(phone);

    const result = await handleIncomingMessage(textMessage(phone, "APAGAR"));
    expect(result.deleted).toBe(true);

    const contacts = await db.select().from(whatsappContact).where(eq(whatsappContact.phone, phone));
    expect(contacts).toHaveLength(0);
    const messages = await db
      .select()
      .from(whatsappMessage)
      .where(eq(whatsappMessage.conversationId, before.id));
    expect(messages).toHaveLength(0);

    createdContactIds = createdContactIds.filter((id) => id !== before.contactId);
  });
});
