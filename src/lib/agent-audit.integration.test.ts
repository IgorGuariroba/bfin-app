import { afterEach, describe, it, expect } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { apiKey, user as userTable } from "@/db/schema";
import { apikeysClient } from "@/lib/apikeys-client";
import { recordAgentWrite } from "@/lib/agent-audit";

let createdUserIds: string[] = [];

async function seedApiKey() {
  const [user] = await db
    .insert(userTable)
    .values({
      id: crypto.randomUUID(),
      name: "Audit User",
      email: `audit-${crypto.randomUUID()}@example.com`,
      plan: "pro",
    })
    .returning();
  createdUserIds.push(user.id);
  const issued = await apikeysClient.issue(user.id);
  const [key] = await db.select().from(apiKey).where(eq(apiKey.id, issued.id));
  return { user, apiKey: key };
}

afterEach(async () => {
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("recordAgentWrite", () => {
  // Log estruturado agora é emitido no processo do bfin-backend (destino do
  // gateway) — coberto lá; aqui só o efeito observável a partir do bfin-app.
  it("atualiza ApiKey.lastUsedAt", async () => {
    const { user, apiKey: key } = await seedApiKey();
    expect(key.lastUsedAt).toBeNull();

    await recordAgentWrite({
      apiKeyId: key.id,
      userId: user.id,
      action: "create",
      entityId: "tx-456",
    });

    const [stored] = await db.select().from(apiKey).where(eq(apiKey.id, key.id));
    expect(stored?.lastUsedAt).not.toBeNull();
  });
});
