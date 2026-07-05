import { afterEach, describe, it, expect, vi } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { apiKey, previsao, tag, tagToTransaction, transaction, user as userTable } from "@/db/schema";
import { fromDbTimestamp, toDbTimestamp } from "@/adapters/drizzle/timestamp";
import { generateApiKey } from "@/lib/api-key";
import { logger } from "@/lib/logger";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { POST } from "./route";

// Tags agora vive no bfin-backend (ADR-0017 #182) — este teste é do gateway
// MCP, não da regra de negócio de Tags (isso já é testado lá). O mock
// reproduz só o suficiente do contrato HTTP (create/list) para os cenários
// abaixo, escrevendo/lendo a mesma tabela que as asserções checam direto.
vi.mock("@/lib/tags-client", async () => {
  const { db } = await import("@/lib/drizzle");
  const { tag } = await import("@/db/schema");
  const { and, eq } = await import("drizzle-orm");
  const { BackendError } = await import("@/lib/backend-client");

  return {
    tagsClient: {
      list: (userId: string) => db.select().from(tag).where(eq(tag.userId, userId)),
      create: async ({ userId, name, color }: { userId: string; name: string; color?: string }) => {
        const trimmed = (name ?? "").trim();
        if (!trimmed) throw new BackendError(400, "Nome da Tag é obrigatório.");
        if (trimmed.length > 50) throw new BackendError(400, "Nome da Tag muito longo (máx. 50).");
        const resolvedColor = color ?? "#94a3b8";
        if (resolvedColor.length < 4 || resolvedColor.length > 30) {
          throw new BackendError(400, "Cor da Tag inválida.");
        }
        const [existing] = await db
          .select()
          .from(tag)
          .where(and(eq(tag.userId, userId), eq(tag.name, trimmed)));
        if (existing) throw new BackendError(400, `Tag "${trimmed}" já existe.`);

        const [row] = await db
          .insert(tag)
          .values({ id: crypto.randomUUID(), userId, name: trimmed, color: resolvedColor, isSystem: false })
          .returning();
        return row;
      },
    },
  };
});

let createdUserIds: string[] = [];

async function seedProKey() {
  const [user] = await db
    .insert(userTable)
    .values({
      id: crypto.randomUUID(),
      name: "MCP User",
      email: `mcp-${crypto.randomUUID()}@example.com`,
      plan: "pro",
    })
    .returning();
  createdUserIds.push(user.id);
  const { plain, prefix, hashedKey } = generateApiKey();
  const [key] = await db
    .insert(apiKey)
    .values({ id: crypto.randomUUID(), userId: user.id, name: "Assistente", prefix, hashedKey })
    .returning();
  return { user, plain, apiKey: key };
}

async function seedTx(data: {
  userId: string;
  type: string;
  description: string;
  amount: number;
  date: Date;
  source?: string;
}) {
  const now = toDbTimestamp(new Date());
  const [row] = await db
    .insert(transaction)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: toDbTimestamp(data.date),
      source: data.source ?? "manual",
      updatedAt: now,
    })
    .returning();
  return { ...row, date: fromDbTimestamp(row.date) };
}

async function seedTxBatch(
  rows: Array<{ userId: string; type: string; description: string; amount: number; date: Date }>
) {
  const now = toDbTimestamp(new Date());
  await db.insert(transaction).values(
    rows.map((r) => ({
      id: crypto.randomUUID(),
      userId: r.userId,
      type: r.type,
      description: r.description,
      amount: r.amount,
      date: toDbTimestamp(r.date),
      updatedAt: now,
    }))
  );
}

async function findTxsByUser(userId: string) {
  const rows = await db.select().from(transaction).where(eq(transaction.userId, userId));
  return rows.map((r) => ({ ...r, date: fromDbTimestamp(r.date) }));
}

async function countTx(userId: string) {
  return (await findTxsByUser(userId)).length;
}

async function findTx(id: string) {
  const [row] = await db.select().from(transaction).where(eq(transaction.id, id));
  return row ? { ...row, date: fromDbTimestamp(row.date) } : null;
}

async function findFirstTx(userId: string) {
  return (await findTxsByUser(userId))[0] ?? null;
}

async function tagsOfTx(txId: string) {
  return db
    .select({ id: tag.id, name: tag.name, color: tag.color })
    .from(tagToTransaction)
    .innerJoin(tag, eq(tag.id, tagToTransaction.a))
    .where(eq(tagToTransaction.b, txId));
}

async function seedTag(userId: string, name: string, color: string) {
  const [row] = await db.insert(tag).values({ id: crypto.randomUUID(), userId, name, color }).returning();
  return row;
}

async function findTagsByUser(userId: string) {
  return db.select().from(tag).where(eq(tag.userId, userId));
}

async function countTags(userId: string) {
  return (await findTagsByUser(userId)).length;
}

async function findFirstTag(userId: string, name: string) {
  const rows = await db.select().from(tag).where(and(eq(tag.userId, userId), eq(tag.name, name)));
  return rows[0] ?? null;
}

async function seedPrevisao(userId: string, name: string, amount: number) {
  await db.insert(previsao).values({ id: crypto.randomUUID(), userId, name, amount });
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

/** Extrai o `result` da resposta JSON-RPC (corpo pode vir como SSE: linha "data: {…}"). */
function parseRpcResult(body: string) {
  const dataLine = body.split("\n").find((l) => l.startsWith("data:"));
  const json = JSON.parse(dataLine ? dataLine.slice("data:".length).trim() : body);
  return json.result as {
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
  };
}

afterEach(async () => {
  vi.restoreAllMocks();
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("POST /api/mcp", () => {
  it("retorna 401 sem header Authorization", async () => {
    const warnSpy = vi.spyOn(logger, "warn");

    const res = await POST(
      mcpRequest(null, { jsonrpc: "2.0", method: "tools/list", id: 1 })
    );

    expect(res.status).toBe(401);
    expect(warnSpy).toHaveBeenCalledWith(
      { reason: "missing_token" },
      "apikey: auth denied"
    );
  });

  it("retorna 401 com token inválido", async () => {
    const warnSpy = vi.spyOn(logger, "warn");

    const res = await POST(
      mcpRequest("sk-bfin-token-invalido", {
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1,
      })
    );

    expect(res.status).toBe(401);
    expect(warnSpy).toHaveBeenCalledWith(
      { reason: "invalid_token" },
      "apikey: auth denied"
    );
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

    const stored = await findTxsByUser(user.id);
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
    expect(await countTx(user.id)).toBe(0);
  });

  it("T7: com candidata duplicata e sem force, sinaliza 'possível duplicata' e não cria", async () => {
    const { user, plain } = await seedProKey();
    await seedTx({
      userId: user.id,
      type: "saida",
      description: "Café",
      amount: 9.5,
      date: new Date(2026, 5, 15, 12, 0, 0),
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
    expect(await countTx(user.id)).toBe(1); // só a pré-existente
  });

  it("T8: com force=true, cria mesmo havendo candidata duplicata", async () => {
    const { user, plain } = await seedProKey();
    await seedTx({
      userId: user.id,
      type: "saida",
      description: "Café",
      amount: 9.5,
      date: new Date(2026, 5, 15, 12, 0, 0),
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
    expect(await countTx(user.id)).toBe(2);
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
    const stored = await findTxsByUser(user.id);
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
    const all = (await findTxsByUser(user.id)).sort((a, b) => a.date.getTime() - b.date.getTime());
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.date.getMonth())).toEqual([5, 6, 7]); // jun, jul, ago
  });

  it("T11: sugere Tag a partir da descrição e associa à transação criada", async () => {
    const { user, plain } = await seedProKey();
    const tagRow = await seedTag(user.id, "Transporte", "#ff385c");

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
    const stored = await findTxsByUser(user.id);
    expect(stored).toHaveLength(1);
    const storedTags = await tagsOfTx(stored[0].id);
    expect(storedTags.map((t) => t.id)).toEqual([tagRow.id]);
  });

  it("get_month_summary responde o resumo do mês em uma chamada", async () => {
    const { user, plain } = await seedProKey();
    await seedTxBatch([
      { userId: user.id, type: "entrada", description: "Salário", amount: 5000, date: new Date(2026, 5, 1, 12) },
      { userId: user.id, type: "saida", description: "Mercado", amount: 800, date: new Date(2026, 5, 5, 12) },
    ]);

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
    await seedTxBatch([
      { userId: user.id, type: "entrada", description: "Salário", amount: 5000, date: new Date(2026, 5, 1, 12) },
      { userId: user.id, type: "cartao", description: "Fatura", amount: 1200, date: new Date(2026, 5, 5, 12) },
    ]);

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
    await seedTx({ userId: user.id, type: "entrada", description: "Renda", amount: 1000, date: new Date(2026, 5, 1, 12) });

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
    await seedTxBatch([
      { userId: user.id, type: "saida", description: "JunhoGasto", amount: 20, date: new Date(2026, 5, 10, 12) },
      { userId: user.id, type: "entrada", description: "JunhoRenda", amount: 500, date: new Date(2026, 5, 11, 12) },
      { userId: user.id, type: "saida", description: "MaioGasto", amount: 99, date: new Date(2026, 4, 10, 12) },
    ]);

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
    await seedTxBatch([
      { userId: user.id, type: "entrada", description: "Pouco", amount: 100, date: new Date(2026, 5, 1, 12) },
      { userId: user.id, type: "saida", description: "Muito", amount: 900, date: new Date(2026, 5, 2, 12) },
    ]);

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
    await seedTag(user.id, "Moradia", "#7b6ef6"); // categoria usada por suggestTag (keyword "aluguel")

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
    const stored = await findTxsByUser(user.id);
    expect(stored).toHaveLength(1);
    const storedTags = await tagsOfTx(stored[0].id);
    expect(storedTags.map((t) => t.name)).toEqual(["Moradia"]);
  });

  it("T13: update_transaction edita uma Transaction existente via MCP", async () => {
    const { user, plain } = await seedProKey();
    const tx = await seedTx({
      userId: user.id,
      type: "saida",
      description: "Mercado",
      amount: 120,
      date: new Date(2026, 5, 10, 12),
      source: "agent",
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
    const stored = await findTx(tx.id);
    expect(stored?.description).toBe("Mercado do mês");
    expect(stored?.amount).toBe(150);
  });

  it("T14: delete_transaction remove fisicamente a Transaction via MCP", async () => {
    const { user, plain } = await seedProKey();
    const tx = await seedTx({
      userId: user.id,
      type: "saida",
      description: "Erro",
      amount: 10,
      date: new Date(2026, 5, 10, 12),
      source: "agent",
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
    expect(await findTx(tx.id)).toBeNull();
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
    const stored = await findTagsByUser(user.id);
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Viagem");
    expect(stored[0].isSystem).toBe(false);
  });

  it("T17: create_tag com nome duplicado vira tool error e não cria uma segunda", async () => {
    const { user, plain } = await seedProKey();
    await seedTag(user.id, "Viagem", "#4a90e2");

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
    expect(await countTags(user.id)).toBe(1);
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
    expect(await countTags(user.id)).toBe(0);
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
    expect(await countTags(user.id)).toBe(0);
  });

  it("T18: list_tag retorna todas as Tags do usuário via MCP", async () => {
    const { user, plain } = await seedProKey();
    await seedTag(user.id, "Viagem", "#4a90e2");
    await seedTag(user.id, "Alimentação", "#f5a623");

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
    expect(body).toContain("Alimentação");
  });

  it("T19: get_previsao retorna a Previsão configurada (somente leitura) via MCP", async () => {
    const { user, plain } = await seedProKey();
    await seedPrevisao(user.id, "Mercado", 1200);

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

  it("T21: estourar o limite de escrita por ApiKey retorna 429 com retry-after", async () => {
    const { apiKey: key, plain } = await seedProKey();

    const createCall = (day: number) =>
      POST(
        mcpRequest(plain, {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "create_transaction",
            arguments: {
              description: "Gasto",
              amount: 10,
              date: `2026-06-${String(day).padStart(2, "0")}`,
              type: "saida",
            },
          },
        })
      );

    // Esgota a janela de escrita: as primeiras chamadas (até o limite) passam.
    for (let day = 1; day <= RATE_LIMITS.write.limit; day++) {
      const res = await createCall(day);
      await res.text();
      expect(res.status).toBe(200);
    }

    // A próxima escrita, dentro da mesma janela, é barrada.
    const warnSpy = vi.spyOn(logger, "warn");
    const blocked = await createCall(RATE_LIMITS.write.limit + 1);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalledWith(
      { apiKeyId: key.id, kind: "write" },
      "apikey: rate limited"
    );
  });

  it("T22: create_transaction devolve o id no structuredContent (ADR-0006) para encadear correção", async () => {
    const { user, plain } = await seedProKey();

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
    const result = parseRpcResult(await res.text());
    const stored = await findFirstTx(user.id);
    expect(result.structuredContent).toMatchObject({
      id: stored!.id,
      duplicated: false,
      type: "saida",
      amount: 9.5,
      date: "2026-06-15",
      tagId: null,
    });
  });

  it("T22b: o id devolvido por create_transaction serve de alvo para um update encadeado", async () => {
    const { plain } = await seedProKey();

    const createRes = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_transaction",
          arguments: { description: "Mercado", amount: 100, date: "2026-06-15", type: "saida" },
        },
      })
    );
    const created = parseRpcResult(await createRes.text());
    const id = created.structuredContent!.id as string;

    const updRes = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "update_transaction", arguments: { id, amount: 150 } },
      })
    );
    const updated = parseRpcResult(await updRes.text());
    expect(updated.structuredContent).toMatchObject({ id, type: "saida", amount: 150 });

    const stored = await findTx(id);
    expect(stored?.amount).toBe(150);
  });

  it("T22c: na duplicata, structuredContent devolve duplicated=true e o id da transação existente", async () => {
    const { user, plain } = await seedProKey();
    const existing = await seedTx({
      userId: user.id,
      type: "saida",
      description: "Café",
      amount: 9.5,
      date: new Date(2026, 5, 15, 12, 0, 0),
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
    const result = parseRpcResult(await res.text());
    expect(result.structuredContent).toMatchObject({
      id: existing.id,
      duplicated: true,
      date: "2026-06-15",
    });
    expect(await countTx(user.id)).toBe(1); // nada criado
  });

  it("T22d: create_tag devolve id/name/color no structuredContent", async () => {
    const { user, plain } = await seedProKey();

    const res = await POST(
      mcpRequest(plain, {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "create_tag", arguments: { name: "Viagem", color: "#4a90e2" } },
      })
    );

    expect(res.status).toBe(200);
    const result = parseRpcResult(await res.text());
    const stored = await findFirstTag(user.id, "Viagem");
    expect(result.structuredContent).toMatchObject({
      id: stored!.id,
      name: "Viagem",
      color: "#4a90e2",
    });
  });

  it("T15: escrita do agente emite log de auditoria (apiKeyId/userId/action/entityId)", async () => {
    const { user, plain, apiKey: key } = await seedProKey();
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

    const tx = await findFirstTx(user.id);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKeyId: key.id,
        userId: user.id,
        action: "create",
        entityId: tx!.id,
      }),
      expect.anything()
    );
  });
});
