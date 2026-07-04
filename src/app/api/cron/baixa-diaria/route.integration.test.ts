import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { transaction, user as userTable } from "@/db/schema";
import { toDbTimestamp } from "@/adapters/drizzle/timestamp";
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
  const [user] = await db
    .insert(userTable)
    .values({
      id: crypto.randomUUID(),
      name: "Cron User",
      email: `cron-${crypto.randomUUID()}@example.com`,
      plan: opts.plan,
      autoBaixaDiario: opts.autoBaixaDiario,
      planExpiresAt: opts.planExpiresAt ? toDbTimestamp(opts.planExpiresAt) : undefined,
    })
    .returning();
  createdUserIds.push(user.id);
  return user;
}

async function makeDiario(userId: string, date: Date, source?: string) {
  const now = toDbTimestamp(new Date());
  const [row] = await db
    .insert(transaction)
    .values({
      id: crypto.randomUUID(),
      userId,
      type: "diario",
      description: "Previsão Diária",
      amount: 300,
      date: toDbTimestamp(date),
      source: source ?? "manual",
      updatedAt: now,
    })
    .returning();
  return row;
}

async function findTx(id: string) {
  const [row] = await db.select().from(transaction).where(eq(transaction.id, id));
  return row ?? null;
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
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
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
    expect(await findTx(diario.id)).toBeNull();
  });

  it("preserva o diário futuro (só apaga o de hoje)", async () => {
    const user = await makeUser({ plan: "pro", autoBaixaDiario: true });
    const { lt } = saoPauloTodayRange();
    const amanha = new Date(lt.getTime() + 12 * 60 * 60 * 1000); // meio-dia de amanhã
    const futuro = await makeDiario(user.id, amanha);

    await POST(cronRequest(SECRET));

    expect(await findTx(futuro.id)).not.toBeNull();
  });

  it("preserva o diário de quem não optou (free e pro com flag desligada)", async () => {
    const free = await makeUser({ plan: "free", autoBaixaDiario: true });
    const proOff = await makeUser({ plan: "pro", autoBaixaDiario: false });
    const dFree = await makeDiario(free.id, todayInside());
    const dProOff = await makeDiario(proOff.id, todayInside());

    await POST(cronRequest(SECRET));

    expect(await findTx(dFree.id)).not.toBeNull();
    expect(await findTx(dProOff.id)).not.toBeNull();
  });

  it("não toca em outros tipos (saida) de hoje, mesmo de pro com flag ligada", async () => {
    const user = await makeUser({ plan: "pro", autoBaixaDiario: true });
    const now = toDbTimestamp(new Date());
    const [saida] = await db
      .insert(transaction)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        type: "saida",
        description: "Mercado",
        amount: 400,
        date: toDbTimestamp(todayInside()),
        updatedAt: now,
      })
      .returning();

    await POST(cronRequest(SECRET));

    expect(await findTx(saida.id)).not.toBeNull();
  });

  it("preserva diário importado do Open Finance (source != manual)", async () => {
    const user = await makeUser({ plan: "pro", autoBaixaDiario: true });
    const importado = await makeDiario(user.id, todayInside(), "pluggy");

    await POST(cronRequest(SECRET));

    expect(await findTx(importado.id)).not.toBeNull();
  });

  it("preserva o diário de um pro com plano vencido (planExpiresAt no passado)", async () => {
    const user = await makeUser({
      plan: "pro",
      autoBaixaDiario: true,
      planExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });
    const diario = await makeDiario(user.id, todayInside());

    await POST(cronRequest(SECRET));

    expect(await findTx(diario.id)).not.toBeNull();
  });
});
