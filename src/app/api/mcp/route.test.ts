import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
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
  await prisma.apiKey.create({
    data: { userId: user.id, name: "Assistente", prefix, hashedKey },
  });
  return { user, plain };
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
});
