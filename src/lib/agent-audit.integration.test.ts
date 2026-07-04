import { afterEach, describe, it, expect, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { apiKey, user as userTable } from "@/db/schema";
import { generateApiKey } from "@/lib/api-key";
import { logger } from "@/lib/logger";
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
  const { prefix, hashedKey } = generateApiKey();
  const [key] = await db
    .insert(apiKey)
    .values({ id: crypto.randomUUID(), userId: user.id, name: "Assistente", prefix, hashedKey })
    .returning();
  return { user, apiKey: key };
}

afterEach(async () => {
  vi.restoreAllMocks();
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("recordAgentWrite", () => {
  it("emite log estruturado com apiKeyId/userId/action/entityId", async () => {
    const { user, apiKey } = await seedApiKey();
    const infoSpy = vi.spyOn(logger, "info");

    await recordAgentWrite({
      apiKeyId: apiKey.id,
      userId: user.id,
      action: "delete",
      entityId: "tx-123",
    });

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyId: apiKey.id,
        userId: user.id,
        action: "delete",
        entityId: "tx-123",
      }),
      expect.anything()
    );
  });

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
