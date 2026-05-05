import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  if (!month) return Response.json({ error: "month required" }, { status: 400 });

  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon || mon < 1 || mon > 12) {
    return Response.json({ error: "invalid month" }, { status: 400 });
  }

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);
  const daysInMonth = new Date(year, mon, 0).getDate();

  const [transactions, previsoes] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id, date: { gte: start, lt: end } },
      select: { type: true, amount: true },
    }),
    prisma.previsao.findMany({
      where: { userId: session.user.id },
      select: { amount: true },
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

  const custoVida = totals.saida + totals.cartao + totals.diario;
  const performance = totals.entrada - custoVida;

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === mon;
  const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

  const diarioMedio = daysElapsed > 0 ? totals.diario / daysElapsed : 0;
  const diarioPrev = daysInMonth > 0 ? previsaoTotal / daysInMonth : 0;

  return Response.json({
    entradas: totals.entrada,
    saidas: totals.saida,
    diarios: totals.diario,
    cartao: totals.cartao,
    economia: totals.economia,
    custoVida,
    performance,
    diarioMedio,
    diarioPrev,
    previsaoTotal,
    daysInMonth,
    daysElapsed,
  });
}
