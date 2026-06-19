import "server-only";

import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/utils";

export class InsightsValidationError extends Error {}

/** Parseia "YYYY-MM" em [year, month(1-12)], rejeitando formato/valor inválido. */
function parseMonth(month: string): [number, number] {
  if (typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
    throw new InsightsValidationError("Invalid month. Expected YYYY-MM");
  }
  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon || mon < 1 || mon > 12) {
    throw new InsightsValidationError("Invalid month");
  }
  return [year, mon];
}

export type SugestaoTipo =
  | "saldo_negativo"
  | "diario_acima"
  | "economia_baixa"
  | "custo_subiu";

export interface Sugestao {
  tipo: SugestaoTipo;
  severidade: "alerta" | "info";
  texto: string;
}

const ECONOMIA_PCT_MINIMA = 10; // abaixo disso, sinaliza economia baixa

/**
 * Insights financeiros proativos derivados dos totais do mês (regras heurísticas).
 * Cada regra acionada vira uma Sugestao com texto pronto para o agente repassar.
 * Lista vazia = nada digno de nota — não força conselho onde não há sinal.
 */
export async function getSugestoes(
  userId: string,
  month: string
): Promise<Sugestao[]> {
  const t = await getTotais(userId, month);
  const sugestoes: Sugestao[] = [];

  if (t.saldoAtual < 0) {
    sugestoes.push({
      tipo: "saldo_negativo",
      severidade: "alerta",
      texto: `Seu saldo do mês está negativo em ${fmt(t.saldoAtual)}. As saídas superaram o que você tinha disponível.`,
    });
  }

  if (t.diarioPrev > 0 && t.diarioMedio > t.diarioPrev) {
    sugestoes.push({
      tipo: "diario_acima",
      severidade: "alerta",
      texto: `Seu gasto diário está em ${fmt(t.diarioMedio)}/dia, acima da Previsão de ${fmt(t.diarioPrev)}/dia.`,
    });
  }

  if (t.entradas > 0) {
    const economiaPct = Math.round((t.economia / t.entradas) * 100);
    if (economiaPct < ECONOMIA_PCT_MINIMA) {
      sugestoes.push({
        tipo: "economia_baixa",
        severidade: "info",
        texto: `Você guardou ${economiaPct}% da renda este mês — abaixo de ${ECONOMIA_PCT_MINIMA}%. Considere reservar um pouco mais.`,
      });
    }
  }

  if (t.prevMonth && t.custoVida > t.prevMonth.custoVida) {
    const delta = t.custoVida - t.prevMonth.custoVida;
    sugestoes.push({
      tipo: "custo_subiu",
      severidade: "info",
      texto: `Seu custo de vida subiu ${fmt(delta)} em relação ao mês anterior (${fmt(t.prevMonth.custoVida)} → ${fmt(t.custoVida)}).`,
    });
  }

  return sugestoes;
}

export interface MonthSummary {
  month: string; // YYYY-MM
  entradas: number;
  saidas: number;
  cartao: number;
  diarios: number;
  economia: number;
  custoVida: number;
  /** Quanto sobrou da renda após o custo de vida no mês (= performance). */
  sobrouNoMes: number;
  saldoAnterior: number;
  saldoAtual: number;
  diarioMedio: number;
  diarioPrev: number;
}

/**
 * Resumo agent-friendly do mês: uma chamada responde "quanto sobrou este mês".
 * Compõe getTotais e expõe o subconjunto relevante para conversa, com o campo
 * sobrouNoMes nomeando a performance (renda − custo de vida).
 */
export async function getMonthSummary(
  userId: string,
  month: string
): Promise<MonthSummary> {
  const t = await getTotais(userId, month);
  return {
    month,
    entradas: t.entradas,
    saidas: t.saidas,
    cartao: t.cartao,
    diarios: t.diarios,
    economia: t.economia,
    custoVida: t.custoVida,
    sobrouNoMes: t.performance,
    saldoAnterior: t.saldoAnterior,
    saldoAtual: t.saldoAtual,
    diarioMedio: t.diarioMedio,
    diarioPrev: t.diarioPrev,
  };
}

export interface SaldoDia {
  day: number;
  date: string; // YYYY-MM-DD
  byType: Record<string, number>;
  accSaldo: number;
}

export interface SaldosResult {
  entries: SaldoDia[];
  prevByType: Record<string, number>;
}

/**
 * Evolução do saldo acumulado dia a dia no mês, partindo do saldo herdado dos
 * meses anteriores (prevByType). Extraído da rota /api/saldos. economia não entra
 * no saldo (é reserva, não custo de vida).
 */
export async function getSaldos(userId: string, month: string): Promise<SaldosResult> {
  const [year, mon] = parseMonth(month);

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const [prevAgg, transactions] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { lt: start } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { type: true, amount: true, date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const prevByType: Record<string, number> = {};
  for (const g of prevAgg) {
    prevByType[g.type] = g._sum.amount ?? 0;
  }

  const daysCount = new Date(year, mon, 0).getDate();
  const byDay: Record<number, Record<string, number>> = {};
  for (let d = 1; d <= daysCount; d++) byDay[d] = {};

  for (const t of transactions) {
    const day = t.date.getDate();
    byDay[day][t.type] = (byDay[day][t.type] ?? 0) + t.amount;
  }

  let accSaldo =
    (prevByType.entrada ?? 0) -
    (prevByType.saida ?? 0) -
    (prevByType.diario ?? 0) -
    (prevByType.cartao ?? 0);
  const entries: SaldoDia[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const bt = byDay[d];
    accSaldo +=
      (bt.entrada ?? 0) - (bt.saida ?? 0) - (bt.diario ?? 0) - (bt.cartao ?? 0);

    entries.push({
      day: d,
      date: `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      byType: bt,
      accSaldo,
    });
  }

  return { entries, prevByType };
}

export interface TotaisResult {
  entradas: number;
  saidas: number;
  diarios: number;
  cartao: number;
  economia: number;
  custoVida: number;
  performance: number;
  saldoAnterior: number;
  saldoAtual: number;
  diarioMedio: number;
  diarioPrev: number;
  previsaoTotal: number;
  daysInMonth: number;
  daysElapsed: number;
  prevMonth: {
    saldoAtual: number;
    custoVida: number;
    diarioMedio: number;
    economiaPct: number;
  } | null;
}

/**
 * Agregação financeira de um mês (totais por tipo, custo de vida, performance,
 * saldo acumulado e comparação com o mês anterior). Extraído da rota /api/totais
 * para ser reutilizado por REST e MCP. Não decide entitlement (gate de plano fica
 * na borda HTTP) — só computa dado um userId + mês.
 */
export async function getTotais(userId: string, month: string): Promise<TotaisResult> {
  const [year, mon] = parseMonth(month);

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

  const prevTotals: Record<string, number> = {
    entrada: 0,
    saida: 0,
    diario: 0,
    cartao: 0,
    economia: 0,
  };
  for (const t of prevMonTx) prevTotals[t.type] = (prevTotals[t.type] ?? 0) + t.amount;
  const prevCustoVida = prevTotals.saida + prevTotals.cartao + prevTotals.diario;
  const prevPerformance = prevTotals.entrada - prevCustoVida;
  const prevDiarioMedio = prevDaysInMonth > 0 ? prevTotals.diario / prevDaysInMonth : 0;
  const prevEconomiaPct =
    prevTotals.entrada > 0
      ? Math.min(100, Math.round((prevTotals.economia / prevTotals.entrada) * 100))
      : 0;
  const hasPrevData = prevMonTx.length > 0;

  return {
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
    prevMonth: hasPrevData
      ? {
          saldoAtual: prevPerformance,
          custoVida: prevCustoVida,
          diarioMedio: prevDiarioMedio,
          economiaPct: prevEconomiaPct,
        }
      : null,
  };
}
