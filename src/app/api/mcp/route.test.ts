import { afterAll, afterEach, describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
import { ensureSystemTags } from "@/lib/seed-system-tags";
import { logger } from "@/lib/logger";
import { POST } from "./route";

let createdUserIds: string[] = [];

async function seedProKey() {
  const user = await prisma.user.create({
    data: {
      name: "MCP User",
      email: `mcp-${crypto.randomUUID()}@example.com`,
      plan: "pro",
    },
  });
  createdUserIds.push(user.id);
  const { plain, prefix, hashedKey } = generateApiKey();
  const apiKey = await prisma.apiKey.create({
    data: { userId: user.id, name: "Assistente", prefix, hashedKey },
  });
  return { user, plain, apiKey };
}

function mcpRequest(token: string | null, body: unknown) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
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

describe("POST /api/mcp", () => {
  it("retorna 401 sem header Authorization", async () => {
    const res = await POST(
      mcpRequest(null, { jsonrpc: "2.0", method: "tools/list", id: 1 })
    );
    expect(res.status).toBe(401);
  });

  it("retorna 401 com token inválido", async () => {
    const res = await POST(
      mcpRequest("sk-bfin-token-invalido", {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1,
      })
    );
    expect(res.status).toBe(401);
  });

  it("cria uma Transaction com source=agent via create_transaction", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: {
            description: "Café",
            amount: 9.5,
            date: "2026-06-15",
            type: "saida",
          },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Movimentação criada");

    const stored = await prisma.transaction.findMany({
      where: { userId: user.id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].source).toBe("agent");
    expect(stored[0].description).toBe("Café");
    expect(stored[0].type).toBe("saida");
  });

  it("rejeita type 'diario' (reservado à projeção) e não cria nada", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: {
            description: "Mercado",
            amount: 50,
            date: "2026-06-15",
            type: "diario",
          },
        },
      })
    );

    await res.text();
    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("T7: com candidata duplicata e sem force, sinaliza 'possível duplicata' e não cria", async () => {
    const { user, plain } = await seedProKey();
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Café",
        amount: 9.5,
        date: new Date(2026, 5, 15, 12, 0, 0),
        source: "manual",
      },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: { description: "Café", amount: 9.5, date: "2026-06-15", type: "saida" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain("duplicata");
    expect(body).toContain("force");
    const c = await prisma.transaction.count({ where: { userId: user.id } });
    expect(c).toBe(1); // só a pré-existente
  });

  it("T8: com force=true, cria mesmo havendo candidata duplicata", async () => {
    const { user, plain } = await seedProKey();
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Café",
        amount: 9.5,
        date: new Date(2026, 5, 15, 12, 0, 0),
        source: "manual",
      },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: { description: "Café", amount: 9.5, date: "2026-06-15", type: "saida", force: true },
        },
      })
    );

    const body = await res.text();
    expect(body).toContain("Movimentação criada");
    const c = await prisma.transaction.count({ where: { userId: user.id } });
    expect(c).toBe(2);
  });

  it("T9: sem type, sugere saida para gasto e cria corretamente", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: { description: "uber", amount: 20, date: "2026-06-15" },
        },
      })
    );

    const body = await res.text();
    expect(body).toContain("Movimentação criada");
    const stored = await prisma.transaction.findMany({ where: { userId: user.id } });
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe("saida");
  });

  it("T10: expõe repeat — cria as ocorrências mensais via MCP", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: {
            description: "Aluguel",
            amount: 2000,
            date: "2026-06-10",
            type: "saida",
            repeat: "monthly",
            repeatEnd: "count",
            repeatCount: 3,
          },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Movimentação criada");
    const all = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    });
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.date.getMonth())).toEqual([5, 6, 7]); // jun, jul, ago
  });

  it("T11: sugere Tag a partir da descrição e associa à transação criada", async () => {
    const { user, plain } = await seedProKey();
    const tag = await prisma.tag.create({
      data: { userId: user.id, name: "Transporte", color: "#ff385c" },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: { description: "uber pro aeroporto", amount: 40, date: "2026-06-15" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text(); // consome o stream — garante que o handler concluiu
    expect(body).toContain("Tag: Transporte");
    const stored = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { tags: true },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].tags.map((t) => t.id)).toEqual([tag.id]);
  });

  it("get_month_summary responde o resumo do mês em uma chamada", async () => {
    const { user, plain } = await seedProKey();
    await prisma.transaction.createMany({
      data: [
        { userId: user.id, type: "entrada", description: "Salário", amount: 5000, date: new Date(2026, 5, 1, 12) },
        { userId: user.id, type: "saida", description: "Mercado", amount: 800, date: new Date(2026, 5, 5, 12) },
      ],
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_month_summary", arguments: { month: "2026-06" } },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("sobrouNoMes");
    expect(body).toContain("4200"); // 5000 - 800
  });

  it("get_totais responde os totais do mês via MCP", async () => {
    const { user, plain } = await seedProKey();
    await prisma.transaction.createMany({
      data: [
        { userId: user.id, type: "entrada", description: "Salário", amount: 5000, date: new Date(2026, 5, 1, 12) },
        { userId: user.id, type: "cartao", description: "Fatura", amount: 1200, date: new Date(2026, 5, 5, 12) },
      ],
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_totais", arguments: { month: "2026-06" } },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("custoVida");
    expect(body).toContain("1200"); // cartao entra no custo de vida
  });

  it("get_saldos responde a evolução diária do saldo via MCP", async () => {
    const { user, plain } = await seedProKey();
    await prisma.transaction.create({
      data: { userId: user.id, type: "entrada", description: "Renda", amount: 1000, date: new Date(2026, 5, 1, 12) },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_saldos", arguments: { month: "2026-06" } },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("entries");
    expect(body).toContain("accSaldo");
  });

  it("get_totais converte InsightsValidationError em tool error (isError), não erro JSON-RPC genérico", async () => {
    const { plain } = await seedProKey();

    // "0000-01" passa o regex do monthSchema (\d{4}) mas parseMonth rejeita (ano 0).
    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_totais", arguments: { month: "0000-01" } },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('"isError":true');
    expect(body.toLowerCase()).toContain("month");
  });

  it("list_transactions filtra por mês e type via MCP", async () => {
    const { user, plain } = await seedProKey();
    await prisma.transaction.createMany({
      data: [
        { userId: user.id, type: "saida", description: "JunhoGasto", amount: 20, date: new Date(2026, 5, 10, 12) },
        { userId: user.id, type: "entrada", description: "JunhoRenda", amount: 500, date: new Date(2026, 5, 11, 12) },
        { userId: user.id, type: "saida", description: "MaioGasto", amount: 99, date: new Date(2026, 4, 10, 12) },
      ],
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "list_transactions", arguments: { month: "2026-06", type: "saida" } },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("JunhoGasto");
    expect(body).not.toContain("JunhoRenda");
    expect(body).not.toContain("MaioGasto");
  });

  it("get_sugestoes retorna insight de saldo negativo via MCP", async () => {
    const { user, plain } = await seedProKey();
    await prisma.transaction.createMany({
      data: [
        { userId: user.id, type: "entrada", description: "Pouco", amount: 100, date: new Date(2026, 5, 1, 12) },
        { userId: user.id, type: "saida", description: "Muito", amount: 900, date: new Date(2026, 5, 2, 12) },
      ],
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_sugestoes", arguments: { month: "2026-06" } },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("saldo_negativo");
  });

  it("T12: cadeia #93 — categorias semeadas por ensureSystemTags são sugeridas via MCP", async () => {
    const { user, plain } = await seedProKey();
    await ensureSystemTags(user.id); // semeia Transporte/Alimentação/Moradia/... como system tags

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: { description: "aluguel do apartamento", amount: 1800, date: "2026-06-05" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Tag: Moradia");
    const stored = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { tags: true },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0].tags.map((t) => t.name)).toEqual(["Moradia"]);
  });

  it("T13: update_transaction edita uma Transaction existente via MCP", async () => {
    const { user, plain } = await seedProKey();
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Mercado",
        amount: 120,
        date: new Date(2026, 5, 10, 12),
        source: "agent",
      },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "update_transaction",
          arguments: { id: tx.id, description: "Mercado do mês", amount: 150 },
        },
      })
    );

    expect(res.status).toBe(200);
    await res.text();
    const stored = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(stored?.description).toBe("Mercado do mês");
    expect(stored?.amount).toBe(150);
  });

  it("T14: delete_transaction remove fisicamente a Transaction via MCP", async () => {
    const { user, plain } = await seedProKey();
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "saida",
        description: "Erro",
        amount: 10,
        date: new Date(2026, 5, 10, 12),
        source: "agent",
      },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "delete_transaction", arguments: { id: tx.id } },
      })
    );

    expect(res.status).toBe(200);
    await res.text();
    const stored = await prisma.transaction.findUnique({ where: { id: tx.id } });
    expect(stored).toBeNull();
  });

  it("T16: create_tag cria uma Tag do usuário (isSystem=false) via MCP", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_tag",
          arguments: { name: "Viagem", color: "#4a90e2" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Viagem");
    const stored = await prisma.tag.findMany({ where: { userId: user.id } });
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Viagem");
    expect(stored[0].isSystem).toBe(false);
  });

  it("T17: create_tag com nome duplicado vira tool error e não cria uma segunda", async () => {
    const { user, plain } = await seedProKey();
    await prisma.tag.create({
      data: { userId: user.id, name: "Viagem", color: "#4a90e2" },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_tag",
          arguments: { name: "Viagem", color: "#000000" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('"isError":true');
    expect(body.toLowerCase()).toContain("já existe");
    const count = await prisma.tag.count({ where: { userId: user.id } });
    expect(count).toBe(1);
  });

  it("T17b: create_tag rejeita name acima de 50 chars (contrato REST) e não cria", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_tag",
          arguments: { name: "a".repeat(51), color: "#4a90e2" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('"isError":true');
    const count = await prisma.tag.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("T17c: create_tag rejeita color inválida (contrato REST) e não cria", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_tag",
          arguments: { name: "Viagem", color: "xx" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('"isError":true');
    const count = await prisma.tag.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("T18: list_tag retorna as Tags do usuário (incl. system tags semeadas) via MCP", async () => {
    const { user, plain } = await seedProKey();
    await prisma.tag.create({
      data: { userId: user.id, name: "Viagem", color: "#4a90e2" },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "list_tag", arguments: {} },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Viagem");
    expect(body).toContain("Alimentação"); // system tag semeada por ensureSystemTags
  });

  it("T19: get_previsao retorna a Previsão configurada (somente leitura) via MCP", async () => {
    const { user, plain } = await seedProKey();
    await prisma.previsao.create({
      data: { userId: user.id, name: "Mercado", amount: 1200 },
    });

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_previsao", arguments: {} },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Mercado");
    expect(body).toContain("1200");
  });

  it("T20: nenhuma tool apply_previsao é exposta (projeção destrutiva fora de escopo)", async () => {
    const { plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, { jsonrpc: "2.0", id: 1, method: "tools/list" })
    );

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).not.toContain("apply_previsao");
    expect(body).not.toContain("aplicar");
  });

  it("T15: escrita do agente emite log de auditoria (apiKeyId/userId/action/entityId)", async () => {
    const { user, plain, apiKey } = await seedProKey();
    const infoSpy = vi.spyOn(logger, "info");

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: { description: "Café", amount: 9.5, date: "2026-06-15", type: "saida" },
        },
      })
    );

    expect(res.status).toBe(200);
    await res.text(); // garante que o handler concluiu

    const tx = await prisma.transaction.findFirst({ where: { userId: user.id } });
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyId: apiKey.id,
        userId: user.id,
        action: "create",
        entityId: tx!.id,
      }),
      expect.anything()
    );
  });
});
