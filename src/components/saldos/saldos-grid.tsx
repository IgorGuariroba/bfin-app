"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock } from "lucide-react";
import { DayRow, type DayEntry, type DayStatus } from "./day-row";
import { generateFakeSaldosEntries } from "@/lib/fake-month-data";

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
  isBlocked: boolean;
  onUpsell: () => void;
  onDayClick: (date: string) => void;
  onTodayStatus?: (status: DayStatus) => void;
}

export function SaldosGrid({ month, filter, isBlocked, onUpsell, onDayClick, onTodayStatus }: SaldosGridProps) {
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
    // fetchData só altera estado após o await do fetch (fonte externa), não de forma síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isBlocked) fetchData(month);
  }, [month, fetchData, isBlocked]);

  useEffect(() => {
    if (isBlocked) return;
    const handler = () => fetchData(month);
    window.addEventListener("bfin:transaction-created", handler);
    return () => window.removeEventListener("bfin:transaction-created", handler);
  }, [month, fetchData, isBlocked]);

  useEffect(() => {
    if (!loading && apiData) {
      const el = document.querySelector("[data-today='true']");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [month, loading, apiData]);

  // Reporta status do dia atual — sempre antes dos early returns
  useEffect(() => {
    if (!apiData || !onTodayStatus) return;
    const today = new Date();
    const [year, mon] = month.split("-").map(Number);
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === mon;
    if (!isCurrentMonth) return;
    const todayEntry = apiData.entries.find((e) => e.day === today.getDate());
    if (!todayEntry) return;
    const s = todayEntry.accSaldo > 0 ? "ok" : todayEntry.accSaldo === 0 ? "warning" : "risk";
    onTodayStatus(s);
  }, [apiData, month, onTodayStatus]);

  // Blocked month: fake data with blur overlay
  if (isBlocked) {
    const fakeEntries = generateFakeSaldosEntries(month);

    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {fakeEntries.map((entry) => (
            <DayRow
              key={entry.day}
              entry={entry}
              filter="all"
              isToday={false}
              onClick={() => {}}
            />
          ))}
        </div>
        {/* Clickable overlay */}
        <button
          onClick={onUpsell}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas/60 backdrop-blur-[2px] cursor-pointer"
        >
          <Lock className="text-ink/60" size={28} />
          <span className="text-sm font-semibold text-ink/80">Veja seu saldo futuro</span>
          <span className="text-xs text-ink/50">Toque para desbloquear</span>
        </button>
      </div>
    );
  }

  if (loading || !apiData) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const rawEntries = applyFilter(apiData.entries, apiData.prevByType, filter);
  const today = new Date();
  const [year, mon] = month.split("-").map(Number);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === mon;
  const todayDay = isCurrentMonth ? today.getDate() : -1;

  const entries: DayEntry[] = rawEntries.map((e) => {
    let status: DayStatus;
    if (e.accSaldo > 0) {
      status = "ok";
    } else if (e.accSaldo === 0) {
      status = "warning";
    } else {
      status = "risk";
    }
    return { ...e, status };
  });

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
