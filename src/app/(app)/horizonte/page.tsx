"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  HorizonteGrid,
  addMonths,
  type MonthData,
} from "@/components/horizonte/horizonte-grid";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function HorizontePage() {
  const [firstMonth, setFirstMonth] = useState(() => addMonths(currentMonth(), -1));
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const months: [string, string, string] = [
    firstMonth,
    addMonths(firstMonth, 1),
    addMonths(firstMonth, 2),
  ];

  const fetchData = useCallback(async (ms: [string, string, string]) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ms.map((m) =>
          fetch(`/api/saldos?month=${m}`)
            .then((r) => (r.ok ? r.json() : { entries: [] }))
            .then((res: { entries: { day: number; accSaldo: number }[] }) => ({
              month: m,
              entries: res.entries ?? [],
            }))
        )
      );
      setData(results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(months);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstMonth]);

  const shift = useCallback((delta: number) => {
    setFirstMonth((m) => addMonths(m, delta));
  }, []);

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* ── Header: ← Horizonte de saldos + ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-3 bg-canvas shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-ink transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-ink">Horizonte de saldos</h1>
        <div className="w-9 h-9" />
      </header>

      <HorizonteGrid
        months={months}
        data={data}
        loading={loading}
        onPrev={() => shift(-3)}
        onNext={() => shift(3)}
        onShift={shift}
      />
    </div>
  );
}
