import type { DayEntry } from "@/components/saldos/day-row";
import type { TotaisData } from "@/hooks/use-totais";
import type { SaldoEntry } from "@/components/horizonte/horizonte-grid";

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function monthSeed(month: string): number {
  return month.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7);
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function generateFakeSaldosEntries(month: string): DayEntry[] {
  const rand = seededRand(monthSeed(month));
  const days = daysInMonth(month);
  const [y, m] = month.split("-").map(Number);

  const baseEntrada = 3000 + rand() * 2000;
  let acc = baseEntrada * 0.3 + rand() * 500;
  const entries: DayEntry[] = [];

  for (let d = 1; d <= days; d++) {
    const byType: Record<string, number> = {};
    if (d === 5 || d === 20) byType.entrada = baseEntrada / 2;
    byType.diario = 20 + rand() * 80;
    if (rand() > 0.75) byType.saida = 100 + rand() * 400;
    if (rand() > 0.85) byType.cartao = 50 + rand() * 200;

    acc += (byType.entrada ?? 0) - (byType.saida ?? 0) - (byType.diario ?? 0) - (byType.cartao ?? 0);

    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    entries.push({ day: d, date: dateStr, byType, accSaldo: Math.round(acc) });
  }

  return entries;
}

export function generateFakeTotaisData(month: string): TotaisData {
  const rand = seededRand(monthSeed(month));
  const days = daysInMonth(month);

  const entradas = Math.round(3500 + rand() * 3000);
  const saidas = Math.round(entradas * (0.15 + rand() * 0.15));
  const diarios = Math.round(entradas * (0.2 + rand() * 0.1));
  const cartao = Math.round(entradas * (0.1 + rand() * 0.1));
  const economia = Math.round(entradas * (0.05 + rand() * 0.1));
  const custoVida = saidas + cartao + diarios;
  const performance = entradas - custoVida - economia;
  const saldoAnterior = Math.round(500 + rand() * 2000);

  return {
    entradas,
    saidas,
    diarios,
    cartao,
    economia,
    custoVida,
    performance,
    saldoAnterior,
    saldoAtual: saldoAnterior + performance,
    diarioMedio: diarios / days,
    diarioPrev: diarios / days * (0.9 + rand() * 0.2),
    previsaoTotal: Math.round(diarios * (0.9 + rand() * 0.2)),
    daysInMonth: days,
    daysElapsed: days,
    prevMonth: null,
  };
}

export function generateFakeHorizonteEntries(month: string): SaldoEntry[] {
  const rand = seededRand(monthSeed(month));
  const days = daysInMonth(month);

  const baseEntrada = 3000 + rand() * 2000;
  let acc = baseEntrada * 0.3 + rand() * 500;
  const entries: SaldoEntry[] = [];

  for (let d = 1; d <= days; d++) {
    if (d === 5 || d === 20) acc += baseEntrada / 2;
    acc -= 20 + rand() * 80;
    if (rand() > 0.75) acc -= 100 + rand() * 300;
    entries.push({ day: d, accSaldo: Math.round(acc) });
  }

  return entries;
}
