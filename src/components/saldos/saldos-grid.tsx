"use client";

import { useState, useEffect, useCallback } from "react";
import { DayRow, type DayEntry } from "./day-row";

type ApiEntry = {
  day: number;
  date: string;
  byType: Record<string, number>;
  accSaldo: number;
};

type ApiResponse = {
  entries: ApiEntry[];
  prevByType: Record<string, number>;
};

function applyFilter(
  entries: ApiEntry[],
  prevByType: Record<string, number>,
  filter: string
): DayEntry[] {
  if (filter === "all") {
    return entries.map((e) => ({ day: e.day, date: e.date, byType: e.byType, accSaldo: e.accSaldo }));
  }

  const sign = filter === "saida" || filter === "diario" || filter === "cartao" ? -1 : 1;
  let acc = sign * (prevByType[filter] ?? 0);

  return entries.map((e) => {
    acc += sign * (e.byType[filter] ?? 0);
    return { day: e.day, date: e.date, byType: e.byType, accSaldo: acc };
  });
}

interface SaldosGridProps {
  month: string;
  filter: string;
  onDayClick: (date: string) => void;
}

export function SaldosGrid({ month, filter, onDayClick }: SaldosGridProps) {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/saldos?month=${m}`);
      if (!res.ok) throw new Error(await res.text());
      setApiData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(month);
  }, [month, fetchData]);

  useEffect(() => {
    const handler = () => fetchData(month);
    window.addEventListener("bfin:transaction-created", handler);
    return () => window.removeEventListener("bfin:transaction-created", handler);
  }, [month, fetchData]);

  useEffect(() => {
    if (!loading && apiData) {
      const el = document.querySelector("[data-today='true']");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [month, loading, apiData]);

  if (loading || !apiData) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const entries = applyFilter(apiData.entries, apiData.prevByType, filter);
  const today = new Date();
  const [year, mon] = month.split("-").map(Number);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === mon;
  const todayDay = isCurrentMonth ? today.getDate() : -1;

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
