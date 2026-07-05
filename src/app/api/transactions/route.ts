import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";
import { freeOldestMonth, getUserPlan, isMonthAllowed } from "@/lib/plan";
import { transactionsClient } from "@/lib/transactions-client";
import { BackendError } from "@/lib/backend-client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  let from = searchParams.get("from") ?? undefined; // YYYY-MM-DD

  const upgradeResponse = () =>
    Response.json(
      { error: "Histórico além de 3 meses disponível apenas no plano Pro", upgrade: true },
      { status: 403 }
    );

  // Gate de histórico do free: vale para qualquer forma de filtro temporal —
  // month, from/to ou ausência de filtro (senão from/to furaria o paywall).
  // Avalia o plano da conta efetiva (dono, em delegação) — ADR-0011.
  const plan = await getUserPlan(userId);
  if (plan === "free") {
    const oldestMonth = freeOldestMonth();
    if (month) {
      if (!isMonthAllowed(month, plan)) return upgradeResponse();
    } else if (from && /^\d{4}-\d{2}/.test(from) && from.slice(0, 7) < oldestMonth) {
      // from malformado passa direto: listTransactions valida e responde 400.
      return upgradeResponse();
    } else if (!from) {
      // Sem limite inferior (só `to` ou nenhum filtro): clampa à janela do
      // free em vez de 403 — não quebra chamadas sem filtro da UI/agente.
      from = `${oldestMonth}-01`;
    }
  }

  try {
    const transactions = await transactionsClient.list(userId, {
      month: month ?? undefined,
      type: searchParams.get("type") ?? undefined,
      tagId: searchParams.get("tagId") ?? undefined,
      from,
      to: searchParams.get("to") ?? undefined,
    });
    return Response.json(transactions);
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const body = await request.json();
  const { type, description, amount, date, repeat, repeatEnd, repeatCount, tagIds } = body;

  try {
    const result = await transactionsClient.create({
      userId,
      type,
      description,
      amount,
      date,
      repeat,
      repeatEnd,
      repeatCount,
      tagIds,
      force: true, // UI: sempre cria (dedup defensivo é feature do agente — ADR-0004)
    });
    return Response.json(result.transaction, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
