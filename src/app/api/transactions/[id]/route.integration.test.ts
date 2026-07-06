import { afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { transaction, user as userTable } from "@/db/schema";
import { toDbTimestamp } from "@/db/timestamp";

const { mockAuth, mockCookieGet } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
// getEffectiveUserId lê cookies de delegação; default (mock resetado) → sem
// cookie → conta própria.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mockCookieGet }),
}));

import { PUT, DELETE } from "./route";

let createdUserIds: string[] = [];

async function makeUser() {
  const [user] = await db
    .insert(userTable)
    .values({
      id: crypto.randomUUID(),
      name: "Tx User",
      email: `tx-${crypto.randomUUID()}@example.com`,
      plan: "pro",
    })
    .returning();
  createdUserIds.push(user.id);
  return user;
}

async function makeTx(userId: string, type = "saida") {
  const now = toDbTimestamp(new Date());
  const [row] = await db
    .insert(transaction)
    .values({
      id: crypto.randomUUID(),
      userId,
      type,
      description: "Mercado",
      amount: 120,
      date: toDbTimestamp(new Date(2026, 5, 10, 12)),
      updatedAt: now,
    })
    .returning();
  return row;
}

async function findTx(id: string) {
  const [row] = await db.select().from(transaction).where(eq(transaction.id, id));
  return row ?? null;
}

function putRequest(id: string, body: unknown) {
  return {
    request: new NextRequest(`http://localhost/api/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
    ctx: { params: Promise.resolve({ id }) },
  };
}

afterEach(async () => {
  vi.resetAllMocks();
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("PUT /api/transactions/[id]", () => {
  it("edita os campos enviados e retorna a transação atualizada", async () => {
    const user = await makeUser();
    mockAuth.mockResolvedValue({ user: { id: user.id } });
    const tx = await makeTx(user.id);

    const { request, ctx } = putRequest(tx.id, {
      type: "saida",
      description: "Feira",
      amount: 90,
      date: "2026-06-11",
    });
    const res = await PUT(request, ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.description).toBe("Feira");
    expect(body.amount).toBe(90);
  });

  it("anti-IDOR: transação de outro dono vira 404 sem mutar", async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    mockAuth.mockResolvedValue({ user: { id: attacker.id } });
    const tx = await makeTx(owner.id);

    const { request, ctx } = putRequest(tx.id, { description: "Hackeado" });
    const res = await PUT(request, ctx);

    expect(res.status).toBe(404);
    const stored = await findTx(tx.id);
    expect(stored?.description).toBe("Mercado");
  });

  it("preserva o fluxo do modal: reenviar type=diario numa transação diario é aceito", async () => {
    const user = await makeUser();
    mockAuth.mockResolvedValue({ user: { id: user.id } });
    const placeholder = await makeTx(user.id, "diario");

    const { request, ctx } = putRequest(placeholder.id, { type: "diario", amount: 75 });
    const res = await PUT(request, ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("diario");
    expect(body.amount).toBe(75);
  });

  it("rejeita transição para diario com 400 (ADR-0004: escrita nunca cria diario)", async () => {
    const user = await makeUser();
    mockAuth.mockResolvedValue({ user: { id: user.id } });
    const tx = await makeTx(user.id, "saida");

    const { request, ctx } = putRequest(tx.id, { type: "diario" });
    const res = await PUT(request, ctx);

    expect(res.status).toBe(400);
    const stored = await findTx(tx.id);
    expect(stored?.type).toBe("saida");
  });
});

describe("DELETE /api/transactions/[id]", () => {
  it("remove a própria transação (204); a de outro dono vira 404", async () => {
    const owner = await makeUser();
    const attacker = await makeUser();
    const tx = await makeTx(owner.id);
    const req = new NextRequest(`http://localhost/api/transactions/${tx.id}`, {
      method: "DELETE",
    });
    const ctx = { params: Promise.resolve({ id: tx.id }) };

    mockAuth.mockResolvedValue({ user: { id: attacker.id } });
    expect((await DELETE(req, ctx)).status).toBe(404);

    mockAuth.mockResolvedValue({ user: { id: owner.id } });
    expect((await DELETE(req, ctx)).status).toBe(204);
    expect(await findTx(tx.id)).toBeNull();
  });
});
