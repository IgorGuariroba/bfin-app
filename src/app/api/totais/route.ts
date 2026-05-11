import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import { getUserPlan, isFutureMonthAllowed } from "@/lib/plan";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  if (!month) return Response.json({ error: "month required" }, { status: 400 });

  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon || mon < 1 || mon > 12) {
    return Response.json({ error: "invalid month" }, { status: 400 });
  }

  const plan = await getUserPlan(userId);
  if (!isFutureMonthAllowed(month, plan)) {
    return Response.json({ error: "plan_required" }, { status: 403 });
  }

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);
  const daysInMonth = new Date(year, mon, 0).getDate();

  const prevMonStart = new Date(year, mon - 2, 1);
  const prevMonEnd = start;
  const prevDaysInMonth = new Date(year, mon - 1, 0).getDate();

  const [transactions, previsoes, prevAgg, prevMonTx] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { type: true, amount: true },
    }),
    prisma.previsao.findMany({
      where: { userId },
      select: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { lt: start } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: prevMonStart, lt: prevMonEnd } },
      select: { type: true, amount: true },
    }),
  ]);

  const totals: Record<string, number> = {
    entrada: 0,
    saida: 0,
    diario: 0,
    cartao: 0,
    economia: 0,
  };

  for (const t of transactions) {
    totals[t.type] = (totals[t.type] ?? 0) + t.amount;
  }

  const previsaoTotal = previsoes.reduce((s, p) => s + p.amount, 0);

  const prevByType: Record<string, number> = {};
  for (const g of prevAgg) prevByType[g.type] = g._sum.amount ?? 0;
  const saldoAnterior =
    (prevByType.entrada ?? 0) -
    (prevByType.saida ?? 0) -
    (prevByType.diario ?? 0) -
    (prevByType.cartao ?? 0);

  const custoVida = totals.saida + totals.cartao + totals.diario;
  const performance = totals.entrada - custoVida;

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === mon;
  const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

  const diarioMedio = daysElapsed > 0 ? totals.diario / daysElapsed : 0;
  const diarioPrev = daysInMonth > 0 ? previsaoTotal / daysInMonth : 0;

  // Previous month metrics for delta display
  const prevTotals: Record<string, number> = { entrada: 0, saida: 0, diario: 0, cartao: 0, economia: 0 };
  for (const t of prevMonTx) prevTotals[t.type] = (prevTotals[t.type] ?? 0) + t.amount;
  const prevCustoVida = prevTotals.saida + prevTotals.cartao + prevTotals.diario;
  const prevPerformance = prevTotals.entrada - prevCustoVida;
  const prevSaldoAtual = prevPerformance; // saldoAnterior excluded — apples-to-apples performance comparison
  const prevDiarioMedio = prevDaysInMonth > 0 ? prevTotals.diario / prevDaysInMonth : 0;
  const prevEconomiaPct = prevTotals.entrada > 0
    ? Math.min(100, Math.round((prevTotals.economia / prevTotals.entrada) * 100))
    : 0;
  const hasPrevData = prevMonTx.length > 0;

  return Response.json({
    entradas: totals.entrada,
    saidas: totals.saida,
    diarios: totals.diario,
    cartao: totals.cartao,
    economia: totals.economia,
    custoVida,
    performance,
    saldoAnterior,
    saldoAtual: saldoAnterior + performance,
    diarioMedio,
    diarioPrev,
    previsaoTotal,
    daysInMonth,
    daysElapsed,
    prevMonth: hasPrevData ? {
      saldoAtual: prevSaldoAtual,
      custoVida: prevCustoVida,
      diarioMedio: prevDiarioMedio,
      economiaPct: prevEconomiaPct,
    } : null,
  });
}
