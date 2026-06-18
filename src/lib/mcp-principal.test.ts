import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
import { resolvePrincipal } from "@/lib/mcp-principal";

let createdUserIds: string[] = [];

async function seedPrincipal(plan: "pro" | "free", overrides: { revoked?: boolean } = {}) {
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: `test-${crypto.randomUUID()}@example.com`,
      plan,
    },
  });
  createdUserIds.push(user.id);

  const { plain, prefix, hashedKey } = generateApiKey();
  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: "Assistente",
      prefix,
      hashedKey,
      revokedAt: overrides.revoked ? new Date() : null,
    },
  });
  return { user, plain, apiKey };
}

afterEach(async () => {
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("mcp-principal", () => {
  it("resolve token válido de User pro e retorna userId/apiKeyId, atualizando lastUsedAt", async () => {
    const { user, plain, apiKey } = await seedPrincipal("pro");

    const principal = await resolvePrincipal(plain);

    expect(principal).toEqual({ userId: user.id, apiKeyId: apiKey.id });

    const refreshed = await prisma.apiKey.findUnique({ where: { id: apiKey.id } });
    expect(refreshed?.lastUsedAt).not.toBeNull();
  });

  it("retorna null para token inexistente", async () => {
    const principal = await resolvePrincipal("sk-bfin-token-que-nao-existe-no-banco");
    expect(principal).toBeNull();
  });

  it("retorna null para ApiKey revogada", async () => {
    const { plain } = await seedPrincipal("pro", { revoked: true });
    const principal = await resolvePrincipal(plain);
    expect(principal).toBeNull();
  });

  it("retorna null para User free, mesmo com ApiKey válida", async () => {
    const { plain } = await seedPrincipal("free");
    const principal = await resolvePrincipal(plain);
    expect(principal).toBeNull();
  });
});
