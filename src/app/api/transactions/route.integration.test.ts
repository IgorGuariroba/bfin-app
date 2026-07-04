import { afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { accountMember, transaction, user as userTable } from "@/db/schema";
import { toDbTimestamp } from "@/adapters/drizzle/timestamp";
import { currentYearMonth } from "@/lib/plan-utils";

const { mockAuth, mockCookieGet } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
// getEffectiveUserId lê cookies de delegação; default (mock resetado) → sem
// cookie → conta própria. Testes de delegação setam active-account.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mockCookieGet }),
}));

import { GET } from "./route";

let createdUserIds: string[] = [];

async function makeUser(plan: "free" | "pro") {
  const [user] = await db
    .insert(userTable)
    .values({
      id: crypto.randomUUID(),
      name: "Paywall User",
      email: `paywall-${crypto.randomUUID()}@example.com`,
      plan,
    })
    .returning();
  createdUserIds.push(user.id);
  return user;
}

async function seedTx(userId: string, description: string, amount: number, date: Date) {
  const now = toDbTimestamp(new Date());
  await db.insert(transaction).values({
    id: crypto.randomUUID(),
    userId,
    type: "gasto",
    description,
    amount,
    date: toDbTimestamp(date),
    updatedAt: now,
  });
}

/** Uma transação antiga (fora da janela free) e uma no mês corrente. */
async function seedHistory(userId: string) {
  const [year, month] = currentYearMonth().split("-").map(Number);
  await seedTx(userId, "Gasto antigo", 100, new Date(2020, 0, 15));
  await seedTx(userId, "Gasto atual", 200, new Date(year, month - 1, 10));
}

function getRequest(qs: string) {
  return new NextRequest(`http://localhost/api/transactions${qs}`);
}

afterEach(async () => {
  // reset (não clear): descarta a implementação do cookie de delegação entre testes.
  vi.resetAllMocks();
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("GET /api/transactions — paywall de histórico (free)", () => {
  it("rejeita from fora da janela com 403 e upgrade", async () => {
    const user = await makeUser("free");
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const res = await GET(getRequest("?from=2020-01-01&to=2020-12-31"));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.upgrade).toBe(true);
  });

  it("sem filtro de data, não retorna transações além da janela", async () => {
    const user = await makeUser("free");
    await seedHistory(user.id);
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const res = await GET(getRequest(""));

    expect(res.status).toBe(200);
    const body = await res.json();
    const descriptions = body.map((t: { description: string }) => t.description);
    expect(descriptions).toContain("Gasto atual");
    expect(descriptions).not.toContain("Gasto antigo");
  });

  it("mantém o 403 para month fora da janela", async () => {
    const user = await makeUser("free");
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const res = await GET(getRequest("?month=2020-01"));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.upgrade).toBe(true);
  });

  it("permite month dentro da janela", async () => {
    const user = await makeUser("free");
    await seedHistory(user.id);
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const res = await GET(getRequest(`?month=${currentYearMonth()}`));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((t: { description: string }) => t.description)).toContain("Gasto atual");
  });

  it("permite from dentro da janela", async () => {
    const user = await makeUser("free");
    await seedHistory(user.id);
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const res = await GET(getRequest(`?from=${currentYearMonth()}-01`));

    expect(res.status).toBe(200);
  });
});

describe("GET /api/transactions — gate pelo plano do dono efetivo em delegação (ADR-0011)", () => {
  /** Convidado com delegação ativa na conta do dono (cookie + AccountMember). */
  async function delegate(ownerId: string, guestId: string) {
    await db.insert(accountMember).values({
      id: crypto.randomUUID(),
      ownerId,
      memberId: guestId,
      inviteEmail: `invite-${crypto.randomUUID()}@example.com`,
      inviteToken: crypto.randomUUID(),
      status: "active",
    });
    mockAuth.mockResolvedValue({ user: { id: guestId } });
    mockCookieGet.mockImplementation((name: string) =>
      name === "active-account" ? { value: ownerId } : undefined
    );
  }

  it("convidado free vendo conta de dono pro acessa histórico completo", async () => {
    const owner = await makeUser("pro");
    const guest = await makeUser("free");
    await seedHistory(owner.id);
    await delegate(owner.id, guest.id);

    const res = await GET(getRequest("?from=2020-01-01"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((t: { description: string }) => t.description)).toContain("Gasto antigo");
  });

  it("convidado pro vendo conta de dono free é limitado à janela de 3 meses", async () => {
    const owner = await makeUser("free");
    const guest = await makeUser("pro");
    await delegate(owner.id, guest.id);

    const res = await GET(getRequest("?month=2020-01"));

    expect(res.status).toBe(403);
    expect((await res.json()).upgrade).toBe(true);
  });

  it("convidado pro em conta free: sem filtro, resposta clampada à janela", async () => {
    const owner = await makeUser("free");
    const guest = await makeUser("pro");
    await seedHistory(owner.id);
    await delegate(owner.id, guest.id);

    const res = await GET(getRequest(""));

    expect(res.status).toBe(200);
    const descriptions = (await res.json()).map((t: { description: string }) => t.description);
    expect(descriptions).toContain("Gasto atual");
    expect(descriptions).not.toContain("Gasto antigo");
  });
});

describe("GET /api/transactions — plano pro sem restrição", () => {
  it("retorna histórico completo com from antigo", async () => {
    const user = await makeUser("pro");
    await seedHistory(user.id);
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const res = await GET(getRequest("?from=2020-01-01"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((t: { description: string }) => t.description)).toContain("Gasto antigo");
  });

  it("retorna histórico completo sem filtro", async () => {
    const user = await makeUser("pro");
    await seedHistory(user.id);
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const res = await GET(getRequest(""));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });
});
