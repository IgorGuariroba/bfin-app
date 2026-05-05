"use client";

import { useEffect } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { DayRow, type DayEntry } from "./day-row";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function computeDailyEntries(
  transactions: { type: string; amount: number; date: string }[],
  year: number,
  month: number,
  filter: string
): DayEntry[] {
  const daysCount = getDaysInMonth(year, month);

  const byDay: Record<number, Record<string, number>> = {};
  for (let d = 1; d <= daysCount; d++) byDay[d] = {};

  for (const t of transactions) {
    const day = parseInt(t.date.split("T")[0].split("-")[2], 10);
    if (day < 1 || day > daysCount) continue;
    byDay[day][t.type] = (byDay[day][t.type] ?? 0) + t.amount;
  }

  let accSaldo = 0;
  const entries: DayEntry[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const bt = byDay[d];

    if (filter === "all") {
      accSaldo += (bt.entrada ?? 0) - (bt.saida ?? 0) - (bt.diario ?? 0) - (bt.cartao ?? 0);
    } else {
      const sign = filter === "saida" || filter === "diario" || filter === "cartao" ? -1 : 1;
      accSaldo += sign * (bt[filter] ?? 0);
    }

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    entries.push({ day: d, date: dateStr, byType: bt, accSaldo });
  }

  return entries;
}

interface SaldosGridProps {
  month: string;
  filter: string;
  onDayClick: (date: string) => void;
}

export function SaldosGrid({ month, filter, onDayClick }: SaldosGridProps) {
  const { transactions, loading, refetch } = useTransactions({ month });

  const [year, mon] = month.split("-").map(Number);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === mon;
  const todayDay = isCurrentMonth ? today.getDate() : -1;

  const entries = computeDailyEntries(transactions, year, mon, filter);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("bfin:transaction-created", handler);
    return () => window.removeEventListener("bfin:transaction-created", handler);
  }, [refetch]);

  useEffect(() => {
    const el = document.querySelector("[data-today='true']");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [month, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[var(--color-muted)]">
        Carregando...
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry) => (
        <DayRow
          key={entry.day}
          entry={entry}
          filter={filter}
          isToday={entry.day === todayDay}
          onClick={() => onDayClick(entry.date)}
        />
      ))}
    </div>
  );
}
