import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  TransactionValidationError,
} from "@/lib/transactions-service";

let createdUserIds: string[] = [];

async function seedUser() {
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: `test-${crypto.randomUUID()}@example.com`,
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

describe("transactions-service create", () => {
  it("cria uma Transaction válida e persiste no banco", async () => {
    const user = await seedUser();

    const tx = await createTransaction({
      userId: user.id,
      type: "entrada",
      description: "Salário",
      amount: 5000,
      date: "2026-06-10",
    });

    const stored = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(stored).not.toBeNull();
    expect(stored?.userId).toBe(user.id);
    expect(stored?.type).toBe("entrada");
    expect(stored?.description).toBe("Salário");
    expect(stored?.amount).toBe(5000);
  });

  it("usa source 'manual' por padrão", async () => {
    const user = await seedUser();

    const tx = await createTransaction({
      userId: user.id,
      type: "entrada",
      description: "Salário",
      amount: 5000,
      date: "2026-06-10",
    });

    expect(tx.source).toBe("manual");
  });

  it("grava source 'agent' quando criada pelo assistente", async () => {
    const user = await seedUser();

    const tx = await createTransaction({
      userId: user.id,
      type: "saida",
      description: "Mercado",
      amount: 120,
      date: "2026-06-10",
      source: "agent",
    });

    expect(tx.source).toBe("agent");
  });

  it("rejeita type inválido e não cria nada", async () => {
    const user = await seedUser();

    await expect(
      createTransaction({
        userId: user.id,
        type: "investimento",
        description: "X",
        amount: 10,
        date: "2026-06-10",
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("rejeita amount não-positivo", async () => {
    const user = await seedUser();

    await expect(
      createTransaction({
        userId: user.id,
        type: "saida",
        description: "X",
        amount: 0,
        date: "2026-06-10",
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);
  });

  it("rejeita date malformada em vez de gravar Invalid Date", async () => {
    const user = await seedUser();

    await expect(
      createTransaction({
        userId: user.id,
        type: "saida",
        description: "X",
        amount: 10,
        date: "não-é-data",
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("rejeita date não-string (número/objeto) como Missing required fields, sem TypeError", async () => {
    const user = await seedUser();

    // Input externo (API/MCP) pode chegar como número se a validação de borda
    // falhar; o serviço deve rejeitar como 400, não estourar TypeError (500).
    await expect(
      createTransaction({
        userId: user.id,
        type: "saida",
        description: "X",
        amount: 10,
        date: 20260610 as unknown as string,
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("rejeita data impossível que o JS rolaria (formato válido, mas inexistente)", async () => {
    const user = await seedUser();

    // 2026-13-45: mês/dia fora do range — o JS "rola" para uma data válida,
    // mas não é o que o caller pediu. O round-trip precisa rejeitar.
    await expect(
      createTransaction({
        userId: user.id,
        type: "saida",
        description: "X",
        amount: 10,
        date: "2026-13-45",
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);

    // 2026-02-30: 30 de fevereiro vira 02 de março.
    await expect(
      createTransaction({
        userId: user.id,
        type: "saida",
        description: "X",
        amount: 10,
        date: "2026-02-30",
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("parseia date YYYY-MM-DD no dia correto (sem off-by-one)", async () => {
    const user = await seedUser();

    const tx = await createTransaction({
      userId: user.id,
      type: "entrada",
      description: "Salário",
      amount: 5000,
      date: "2026-06-10",
    });

    expect(tx.date.getFullYear()).toBe(2026);
    expect(tx.date.getMonth()).toBe(5); // junho (0-indexed)
    expect(tx.date.getDate()).toBe(10);
  });

  it("gera ocorrências extras quando repeat é mensal com count", async () => {
    const user = await seedUser();

    await createTransaction({
      userId: user.id,
      type: "saida",
      description: "Aluguel",
      amount: 2000,
      date: "2026-06-10",
      repeat: "monthly",
      repeatEnd: "count",
      repeatCount: 3,
    });

    const all = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    });
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.date.getMonth())).toEqual([5, 6, 7]); // jun, jul, ago
  });

  it("associa tags só às ocorrências novas, sem contaminar transações pré-existentes coincidentes", async () => {
    const user = await seedUser();
    const tag = await prisma.tag.create({
      data: { userId: user.id, name: "Casa", color: "#abc" },
    });

    // Transação pré-existente que coincide em userId/description/type e data
    // com uma das ocorrências futuras do repeat — NÃO deve receber a tag.
    const preexisting = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Aluguel",
        amount: 2000,
        date: new Date(2026, 6, 10, 12, 0, 0), // 2026-07-10 12:00
      },
    });

    await createTransaction({
      userId: user.id,
      type: "saida",
      description: "Aluguel",
      amount: 2000,
      date: "2026-06-10",
      repeat: "monthly",
      repeatEnd: "count",
      repeatCount: 3,
      tagIds: [tag.id],
    });

    const tagged = await prisma.transaction.findMany({
      where: { userId: user.id, tags: { some: { id: tag.id } } },
    });
    expect(tagged).toHaveLength(3); // base + 2 extras, nenhuma a mais

    const refreshedPre = await prisma.transaction.findUnique({
      where: { id: preexisting.id },
      include: { tags: true },
    });
    expect(refreshedPre?.tags).toHaveLength(0);
  });
});
