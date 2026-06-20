import { afterAll, afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { saoPauloTodayRange } from "@/lib/date-utils";
import { POST } from "./route";

const SECRET = "test-cron-secret";

let createdUserIds: string[] = [];

/** Data dentro da janela de hoje em São Paulo (meio-dia, como o app grava o diário). */
function todayInside(): Date {
  const { gte } = saoPauloTodayRange();
  return new Date(gte.getTime() + 12 * 60 * 60 * 1000);
}

async function makeUser(opts: {
  plan: string;
  autoBaixaDiario: boolean;
  planExpiresAt?: Date;
}) {
  const user = await prisma.user.create({
    data: {
      name: "Cron User",
      email: `cron-${crypto.randomUUID()}@example.com`,
      plan: opts.plan,
      autoBaixaDiario: opts.autoBaixaDiario,
      planExpiresAt: opts.planExpiresAt,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

function makeDiario(userId: string, date: Date) {
  return prisma.transaction.create({
    data: { userId, type: "diario", description: "Previsão Diária", amount: 300, date },
  });
}

function cronRequest(secret: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret !== null) headers["x-cron-secret"] = secret;
  return new Request("http://localhost/api/cron/baixa-diaria", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/cron/baixa-diaria", () => {
  it("retorna 401 sem o header x-cron-secret", async () => {
    const res = await POST(cronRequest(null));
    expect(res.status).toBe(401);
  });

  it("retorna 401 com secret errado", async () => {
    const res = await POST(cronRequest("secret-errado"));
    expect(res.status).toBe(401);
  });

  it("retorna 500 (fail-closed) quando CRON_SECRET não está configurado", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await POST(cronRequest(SECRET));
    expect(res.status).toBe(500);
  });

  it("apaga o diário de hoje de um usuário pro com a flag ligada", async () => {
    const user = await makeUser({ plan: "pro", autoBaixaDiario: true });
    const diario = await makeDiario(user.id, todayInside());

    const res = await POST(cronRequest(SECRET));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBeGreaterThanOrEqual(1);
    expect(await prisma.transaction.findUnique({ where: { id: diario.id } })).toBeNull();
  });

  it("preserva o diário futuro (só apaga o de hoje)", async () => {
    const user = await makeUser({ plan: "pro", autoBaixaDiario: true });
    const { lt } = saoPauloTodayRange();
    const amanha = new Date(lt.getTime() + 12 * 60 * 60 * 1000); // meio-dia de amanhã
    const futuro = await makeDiario(user.id, amanha);

    await POST(cronRequest(SECRET));

    expect(await prisma.transaction.findUnique({ where: { id: futuro.id } })).not.toBeNull();
  });

  it("preserva o diário de quem não optou (free e pro com flag desligada)", async () => {
    const free = await makeUser({ plan: "free", autoBaixaDiario: true });
    const proOff = await makeUser({ plan: "pro", autoBaixaDiario: false });
    const dFree = await makeDiario(free.id, todayInside());
    const dProOff = await makeDiario(proOff.id, todayInside());

    await POST(cronRequest(SECRET));

    expect(await prisma.transaction.findUnique({ where: { id: dFree.id } })).not.toBeNull();
    expect(await prisma.transaction.findUnique({ where: { id: dProOff.id } })).not.toBeNull();
  });

  it("não toca em outros tipos (saida) de hoje, mesmo de pro com flag ligada", async () => {
    const user = await makeUser({ plan: "pro", autoBaixaDiario: true });
    const saida = await prisma.transaction.create({
      data: { userId: user.id, type: "saida", description: "Mercado", amount: 400, date: todayInside() },
    });

    await POST(cronRequest(SECRET));

    expect(await prisma.transaction.findUnique({ where: { id: saida.id } })).not.toBeNull();
  });

  it("preserva diário importado do Open Finance (source != manual)", async () => {
    const user = await makeUser({ plan: "pro", autoBaixaDiario: true });
    const importado = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "diario",
        source: "pluggy",
        description: "Previsão Diária",
        amount: 300,
        date: todayInside(),
      },
    });

    await POST(cronRequest(SECRET));

    expect(await prisma.transaction.findUnique({ where: { id: importado.id } })).not.toBeNull();
  });

  it("preserva o diário de um pro com plano vencido (planExpiresAt no passado)", async () => {
    const user = await makeUser({
      plan: "pro",
      autoBaixaDiario: true,
      planExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    const diario = await makeDiario(user.id, todayInside());

    await POST(cronRequest(SECRET));

    expect(await prisma.transaction.findUnique({ where: { id: diario.id } })).not.toBeNull();
  });
});
