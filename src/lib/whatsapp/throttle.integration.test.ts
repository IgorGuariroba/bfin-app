import { afterEach, describe, it, expect } from "vitest";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappContact, whatsappConversation, whatsappMessage } from "@/db/schema";
import { isRateLimited } from "@/lib/whatsapp/throttle";

let createdContactIds: string[] = [];

async function seedConversation() {
  const [contact] = await db
    .insert(whatsappContact)
    .values({ id: crypto.randomUUID(), phone: `+55119${Math.floor(Math.random() * 1e8)}` })
    .returning();
  createdContactIds.push(contact.id);

  const [conversation] = await db
    .insert(whatsappConversation)
    .values({ id: crypto.randomUUID(), contactId: contact.id })
    .returning();
  return conversation;
}

async function addInboundMessages(conversationId: string, n: number) {
  for (let i = 0; i < n; i++) {
    await db.insert(whatsappMessage).values({
      id: crypto.randomUUID(),
      conversationId,
      direction: "inbound",
      sender: "user",
      body: `msg ${i}`,
    });
  }
}

afterEach(async () => {
  if (createdContactIds.length) {
    await db.delete(whatsappContact).where(inArray(whatsappContact.id, createdContactIds));
    createdContactIds = [];
  }
});

describe("isRateLimited", () => {
  it("libera conversa com poucas mensagens inbound na janela", async () => {
    const conversation = await seedConversation();
    await addInboundMessages(conversation.id, 5);

    expect(await isRateLimited(conversation.id)).toBe(false);
  });

  it("bloqueia conversa ao atingir o teto de mensagens inbound na janela", async () => {
    const conversation = await seedConversation();
    await addInboundMessages(conversation.id, 20);

    expect(await isRateLimited(conversation.id)).toBe(true);
  });

  it("ignora mensagens outbound na contagem", async () => {
    const conversation = await seedConversation();
    for (let i = 0; i < 20; i++) {
      await db.insert(whatsappMessage).values({
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        direction: "outbound",
        sender: "bot",
        body: `msg ${i}`,
      });
    }

    expect(await isRateLimited(conversation.id)).toBe(false);
  });
});
