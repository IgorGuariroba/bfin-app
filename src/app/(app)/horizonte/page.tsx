"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  HorizonteGrid,
  addMonths,
  type MonthData,
} from "@/components/horizonte/horizonte-grid";
import { usePlanContext } from "@/components/providers/plan-provider";
import { currentYearMonth, freeNewestMonth } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

export default function HorizontePage() {
  const plan = usePlanContext();
  const [firstMonth, setFirstMonth] = useState(() => addMonths(currentYearMonth(), -1));
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

  const isNextShiftLocked = plan === "free" && months[2] >= freeNewestMonth();

  const shift = useCallback((delta: number) => {
    setFirstMonth((m) => {
      const next = addMonths(m, delta);
      if (plan === "free" && delta > 0) {
        const cappedFirst = addMonths(freeNewestMonth(), -2);
        return next > cappedFirst ? cappedFirst : next;
      }
      return next;
    });
  }, [plan]);

  return (
    <div className="flex flex-col">
      {/* ── Header: ← Horizonte de saldos + ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-3 bg-canvas">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full text-ink hover:bg-hairline-soft transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-ink">Horizonte de saldos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-3)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-ink hover:bg-hairline-soft transition-colors"
            aria-label="Meses anteriores"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={isNextShiftLocked ? undefined : () => shift(3)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
              isNextShiftLocked
                ? "text-ink/30 cursor-default"
                : "text-ink hover:bg-hairline-soft"
            )}
            aria-label={isNextShiftLocked ? "Meses futuros disponíveis no plano Pro" : "Próximos meses"}
            title={isNextShiftLocked ? "Meses futuros disponíveis no plano Pro" : undefined}
          >
            {isNextShiftLocked ? <Lock size={16} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </header>

      <HorizonteGrid
        months={months}
        data={data}
        loading={loading}
      />
    </div>
  );
}
