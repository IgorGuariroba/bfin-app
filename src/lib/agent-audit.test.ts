import { afterAll, afterEach, describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
import { logger } from "@/lib/logger";
import { recordAgentWrite } from "@/lib/agent-audit";

let createdUserIds: string[] = [];

async function seedApiKey() {
  const user = await prisma.user.create({
    data: {
      name: "Audit User",
      email: `audit-${crypto.randomUUID()}@example.com`,
      plan: "pro",
    },
  });
  createdUserIds.push(user.id);
  const { prefix, hashedKey } = generateApiKey();
  const apiKey = await prisma.apiKey.create({
    data: { userId: user.id, name: "Assistente", prefix, hashedKey },
  });
  return { user, apiKey };
}

afterEach(async () => {
  vi.restoreAllMocks();
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

afterAll(async () => {
  await prisma.$disconnect();
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
    const { user, apiKey } = await seedApiKey();
    expect(apiKey.lastUsedAt).toBeNull();

    await recordAgentWrite({
      apiKeyId: apiKey.id,
      userId: user.id,
      action: "create",
      entityId: "tx-456",
    });

    const stored = await prisma.apiKey.findUnique({ where: { id: apiKey.id } });
    expect(stored?.lastUsedAt).not.toBeNull();
  });
});
