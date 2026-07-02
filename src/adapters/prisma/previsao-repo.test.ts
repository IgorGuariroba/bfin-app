import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { previsaoService } from "@/adapters";
import { PrevisaoNotFoundError } from "@/core/previsao";

let createdUserIds: string[] = [];

async function seedUser() {
  const user = await prisma.user.create({
    data: {
      name: "Previsao User",
      email: `previsao-${crypto.randomUUID()}@example.com`,
      plan: "pro",
    },
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

describe("previsao-service CRUD", () => {
  it("cria, lista em ordem de name, atualiza e deleta", async () => {
    const user = await seedUser();

    await previsaoService.createPrevisao({ userId: user.id, name: "Uber", amount: 200 });
    const mercado = await previsaoService.createPrevisao({
      userId: user.id,
      name: "Mercado",
      amount: 800,
    });

    const listed = await previsaoService.listPrevisoes(user.id);
    expect(listed.map((p) => p.name)).toEqual(["Mercado", "Uber"]);

    const updated = await previsaoService.updatePrevisao({
      userId: user.id,
      id: mercado.id,
      amount: 900,
    });
    expect(updated).toMatchObject({ name: "Mercado", amount: 900 });

    await previsaoService.deletePrevisao(user.id, mercado.id);
    expect(await prisma.previsao.findUnique({ where: { id: mercado.id } })).toBeNull();
  });

  it("não deixa editar previsão de outro dono (not found)", async () => {
    const dono = await seedUser();
    const invasor = await seedUser();
    const prev = await previsaoService.createPrevisao({
      userId: dono.id,
      name: "Mercado",
      amount: 800,
    });

    await expect(
      previsaoService.updatePrevisao({ userId: invasor.id, id: prev.id, amount: 1 })
    ).rejects.toThrow(PrevisaoNotFoundError);
  });
});

describe("previsao-service applyPrevisao", () => {
  it("materializa a projeção: um diario manual ao meio-dia por dia na janela de 12 meses", async () => {
    const user = await seedUser();

    const { count } = await previsaoService.applyPrevisao({ userId: user.id, amount: 150 });

    const stored = await prisma.transaction.findMany({
      where: { userId: user.id, type: "diario" },
      orderBy: { date: "asc" },
    });
    expect(stored).toHaveLength(count);
    expect(count).toBeGreaterThanOrEqual(365);
    expect(stored[0]).toMatchObject({
      description: "Previsão Diária",
      amount: 150,
      source: "manual",
    });
  });

  it("recria os diario manuais da janela mas preserva importados (source=pluggy)", async () => {
    const user = await seedUser();
    const emUmMes = new Date();
    emUmMes.setMonth(emUmMes.getMonth() + 1);

    const manualAntigo = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "diario",
        description: "Previsão Diária",
        amount: 99,
        date: emUmMes,
      },
    });
    const importado = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "diario",
        source: "pluggy",
        description: "Previsão Diária",
        amount: 99,
        date: emUmMes,
      },
    });

    await previsaoService.applyPrevisao({ userId: user.id, amount: 150 });

    expect(
      await prisma.transaction.findUnique({ where: { id: manualAntigo.id } })
    ).toBeNull();
    expect(
      await prisma.transaction.findUnique({ where: { id: importado.id } })
    ).not.toBeNull();
  });
});
