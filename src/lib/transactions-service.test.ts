import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  suggestTag,
  suggestType,
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

    const { transaction: tx } = await createTransaction({
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

    const { transaction: tx } = await createTransaction({
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

    const { transaction: tx } = await createTransaction({
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

    const { transaction: tx } = await createTransaction({
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

  it("rejeita tagIds de outro usuário (anti-IDOR) e não cria nada", async () => {
    const owner = await seedUser();
    const attacker = await seedUser();
    // Tag pertencente ao owner — o attacker não pode conectá-la.
    const foreignTag = await prisma.tag.create({
      data: { userId: owner.id, name: "Privada", color: "#abc" },
    });

    await expect(
      createTransaction({
        userId: attacker.id,
        type: "saida",
        description: "X",
        amount: 10,
        date: "2026-06-10",
        tagIds: [foreignTag.id],
      })
    ).rejects.toBeInstanceOf(TransactionValidationError);

    const count = await prisma.transaction.count({ where: { userId: attacker.id } });
    expect(count).toBe(0);
  });

  it("aceita tagIds duplicados (deduplica) e conecta a tag uma única vez", async () => {
    const user = await seedUser();
    const tag = await prisma.tag.create({
      data: { userId: user.id, name: "Casa", color: "#abc" },
    });

    const { transaction: tx } = await createTransaction({
      userId: user.id,
      type: "saida",
      description: "Aluguel",
      amount: 2000,
      date: "2026-06-10",
      tagIds: [tag.id, tag.id], // duplicado: não deve falhar como "Invalid tags"
    });

    const stored = await prisma.transaction.findUnique({
      where: { id: tx.id },
      include: { tags: true },
    });
    expect(stored?.tags.map((t) => t.id)).toEqual([tag.id]);
  });
});

describe("createTransaction — dedup defensivo (ADR-0004)", () => {
  it("T1: sem force, retorna a candidata existente (duplicated) e não cria linha nova", async () => {
    const user = await seedUser();
    // Candidata pré-existente: mesmo amount + mesmo dia + mesmo type.
    const existing = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Uber",
        amount: 30,
        date: new Date(2026, 5, 10, 12, 0, 0), // 2026-06-10
        source: "manual",
      },
    });

    const result = await createTransaction({
      userId: user.id,
      type: "saida",
      description: "Uber",
      amount: 30,
      date: "2026-06-10",
    });

    expect(result.duplicated).toBe(true);
    expect(result.transaction.id).toBe(existing.id);
    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(1); // nenhuma linha nova
  });

  it("T2: com force=true, cria nova transação mesmo havendo candidata", async () => {
    const user = await seedUser();
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Uber",
        amount: 30,
        date: new Date(2026, 5, 10, 12, 0, 0),
        source: "manual",
      },
    });

    const result = await createTransaction({
      userId: user.id,
      type: "saida",
      description: "Uber",
      amount: 30,
      date: "2026-06-10",
      force: true,
    });

    expect(result.duplicated).toBe(false);
    const all = await prisma.transaction.findMany({ where: { userId: user.id } });
    expect(all).toHaveLength(2);
  });

  it("T3: janela de ±2 dias — 1 e 2 dias casam; 3 dias não", async () => {
    const user = await seedUser();
    const seed = (dayOffset: number) =>
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: "saida",
          description: "Gasto",
          amount: 50,
          date: new Date(2026, 5, 10 + dayOffset, 12, 0, 0),
          source: "manual",
        },
      });

    // +1 dia → candidata
    const near1 = await seed(1);
    let r = await createTransaction({ userId: user.id, type: "saida", description: "Outro", amount: 50, date: "2026-06-10" });
    expect(r.duplicated).toBe(true);
    expect(r.transaction.id).toBe(near1.id);
    await prisma.transaction.deleteMany({ where: { userId: user.id } });

    // +2 dias → candidata (limite inclusivo)
    const near2 = await seed(2);
    r = await createTransaction({ userId: user.id, type: "saida", description: "Outro", amount: 50, date: "2026-06-10" });
    expect(r.duplicated).toBe(true);
    expect(r.transaction.id).toBe(near2.id);
    await prisma.transaction.deleteMany({ where: { userId: user.id } });

    // +3 dias → NÃO é candidata → cria normal
    await seed(3);
    r = await createTransaction({ userId: user.id, type: "saida", description: "Outro", amount: 50, date: "2026-06-10" });
    expect(r.duplicated).toBe(false);
    const all = await prisma.transaction.findMany({ where: { userId: user.id } });
    expect(all).toHaveLength(2); // a de +3 dias + a recém-criada
  });

  it("T4: type ou amount diferente não é candidata → cria normal", async () => {
    const user = await seedUser();
    await prisma.transaction.create({
      data: { userId: user.id, type: "saida", description: "Uber", amount: 30, date: new Date(2026, 5, 10, 12, 0, 0), source: "manual" },
    });

    // type diferente
    let r = await createTransaction({ userId: user.id, type: "entrada", description: "Uber", amount: 30, date: "2026-06-10" });
    expect(r.duplicated).toBe(false);

    // amount diferente
    r = await createTransaction({ userId: user.id, type: "saida", description: "Uber", amount: 31, date: "2026-06-10" });
    expect(r.duplicated).toBe(false);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(3); // 1 pré-existente + 2 criadas
  });

  it("T5: cross-source — candidata pluggy é casada por create do agente", async () => {
    const user = await seedUser();
    const pluggy = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Mercado",
        amount: 120,
        date: new Date(2026, 5, 10, 12, 0, 0),
        source: "pluggy",
        externalId: "pluggy-xyz",
      },
    });

    const r = await createTransaction({
      userId: user.id,
      type: "saida",
      description: "Mercado",
      amount: 120,
      date: "2026-06-10",
      source: "agent",
    });

    expect(r.duplicated).toBe(true);
    expect(r.transaction.id).toBe(pluggy.id);
    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(1);
  });
});

describe("suggestType", () => {
  it("T6: classifica gasto real como saida, receita como entrada — nunca diario", () => {
    // gastos → saida
    expect(suggestType("uber")).toBe("saida");
    expect(suggestType("Mercado")).toBe("saida");
    expect(suggestType("aluguel")).toBe("saida");
    // receitas → entrada
    expect(suggestType("salário")).toBe("entrada");
    expect(suggestType("Salario recebido")).toBe("entrada");
    expect(suggestType("recebi freela")).toBe("entrada");
    // nunca retorna diario (sequência vazia ou palavra "diário" no texto)
    expect(suggestType("")).toBe("saida");
    expect(suggestType("diário")).toBe("saida");
  });
});

describe("suggestTag", () => {
  // Espelha a taxonomia canônica de CATEGORY_TAGS (#93), com ids fictícios.
  const tags = [
    { id: "t-alim", name: "Alimentação" },
    { id: "t-transp", name: "Transporte" },
    { id: "t-moradia", name: "Moradia" },
    { id: "t-lazer", name: "Lazer" },
    { id: "t-saude", name: "Saúde" },
  ];

  it("T10: casa o nome da própria Tag presente na descrição (sem sensibilidade a acento)", () => {
    expect(suggestTag("alimentacao do mês", tags)).toBe("t-alim");
    expect(suggestTag("Transporte mensal", tags)).toBe("t-transp");
  });

  it("T11: casa por sinônimo de categoria → Tag correspondente", () => {
    expect(suggestTag("uber pro trabalho", tags)).toBe("t-transp");
    expect(suggestTag("Mercado da esquina", tags)).toBe("t-alim");
    expect(suggestTag("netflix", tags)).toBe("t-lazer");
    // categorias novas da #93
    expect(suggestTag("aluguel do mês", tags)).toBe("t-moradia");
    expect(suggestTag("farmacia popular", tags)).toBe("t-saude");
  });

  it("T12: retorna null quando nada casa ou não há Tag para a categoria", () => {
    expect(suggestTag("pagamento genérico xyz", tags)).toBeNull();
    expect(suggestTag("", tags)).toBeNull();
    // keyword de transporte, mas usuário não tem a Tag Transporte
    expect(suggestTag("uber", [{ id: "t-alim", name: "Alimentação" }])).toBeNull();
  });
});
