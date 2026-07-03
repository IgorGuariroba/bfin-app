import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { apiKeysService } from "@/adapters";
import { ApiKeyNotFoundError } from "@/core/apikeys";

let createdUserIds: string[] = [];

async function seedUser(plan = "pro") {
  const user = await prisma.user.create({
    data: { name: "ApiKey User", email: `apikey-${crypto.randomUUID()}@example.com`, plan },
  });
  createdUserIds.push(user.id);
  return user;
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

describe("issueApiKey", () => {
  it("emite uma chave e a lista sem o hash", async () => {
    const user = await seedUser();
    const issued = await apiKeysService.issueApiKey(user.id);
    expect(issued.plain).toMatch(/^sk-bfin-/);

    const list = await apiKeysService.listApiKeys(user.id);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: issued.id, name: issued.name, prefix: issued.prefix });
  });

  it("revoga a chave anterior ao emitir uma nova (invariante: 1 ativa por vez)", async () => {
    const user = await seedUser();
    const primeira = await apiKeysService.issueApiKey(user.id);
    const segunda = await apiKeysService.issueApiKey(user.id);

    const list = await apiKeysService.listApiKeys(user.id);
    expect(list.find((k) => k.id === primeira.id)?.revokedAt).not.toBeNull();
    expect(list.find((k) => k.id === segunda.id)?.revokedAt).toBeNull();
  });
});

describe("revokeApiKey", () => {
  it("revoga e é idempotente (preserva o revokedAt original)", async () => {
    const user = await seedUser();
    const issued = await apiKeysService.issueApiKey(user.id);

    await apiKeysService.revokeApiKey(user.id, issued.id);
    const [afterFirst] = await apiKeysService.listApiKeys(user.id);
    expect(afterFirst.revokedAt).not.toBeNull();

    await apiKeysService.revokeApiKey(user.id, issued.id);
    const [afterSecond] = await apiKeysService.listApiKeys(user.id);
    expect(afterSecond.revokedAt?.getTime()).toBe(afterFirst.revokedAt?.getTime());
  });

  it("id de outra conta é not found (anti-IDOR)", async () => {
    const dono = await seedUser();
    const invasor = await seedUser();
    const issued = await apiKeysService.issueApiKey(dono.id);

    await expect(apiKeysService.revokeApiKey(invasor.id, issued.id)).rejects.toBeInstanceOf(
      ApiKeyNotFoundError
    );
  });
});

describe("resolvePrincipal", () => {
  it("resolve o principal de uma chave válida e carimba lastUsedAt", async () => {
    const user = await seedUser();
    const issued = await apiKeysService.issueApiKey(user.id);

    expect(await apiKeysService.resolvePrincipal(issued.plain)).toEqual({
      userId: user.id,
      apiKeyId: issued.id,
    });
    const [key] = await apiKeysService.listApiKeys(user.id);
    expect(key.lastUsedAt).not.toBeNull();
  });

  it("rejeita chave de usuário que sofreu downgrade para free", async () => {
    const user = await seedUser("pro");
    const issued = await apiKeysService.issueApiKey(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { plan: "free" } });

    expect(await apiKeysService.resolvePrincipal(issued.plain)).toBeNull();
  });
});
