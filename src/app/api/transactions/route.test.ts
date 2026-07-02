import { afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentYearMonth } from "@/lib/plan-utils";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
// getEffectiveUserId lê cookies de delegação; sem cookie → conta própria.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import { GET } from "./route";

let createdUserIds: string[] = [];

async function makeUser(plan: "free" | "pro") {
  const user = await prisma.user.create({
    data: {
      name: "Paywall User",
      email: `paywall-${crypto.randomUUID()}@example.com`,
      plan,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

/** Uma transação antiga (fora da janela free) e uma no mês corrente. */
async function seedHistory(userId: string) {
  const [year, month] = currentYearMonth().split("-").map(Number);
  await prisma.transaction.create({
    data: {
      userId,
      type: "gasto",
      description: "Gasto antigo",
      amount: 100,
      date: new Date(2020, 0, 15),
    },
  });
  await prisma.transaction.create({
    data: {
      userId,
      type: "gasto",
      description: "Gasto atual",
      amount: 200,
      date: new Date(year, month - 1, 10),
    },
  });
}

function getRequest(qs: string) {
  return new NextRequest(`http://localhost/api/transactions${qs}`);
}

afterEach(async () => {
  vi.clearAllMocks();
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
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
