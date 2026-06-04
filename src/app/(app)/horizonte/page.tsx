"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HorizonteGrid,
  addMonths,
  type MonthData,
} from "@/components/horizonte/horizonte-grid";
import { ProUpsellSheet } from "@/components/plan/pro-upsell-sheet";
import { usePlanContext } from "@/components/providers/plan-provider";
import { currentYearMonth, freeNewestMonth } from "@/hooks/use-plan";

type Period = 3 | 6 | 12;
const PERIODS: Period[] = [3, 6, 12];

export default function HorizontePage() {
  const plan = usePlanContext();
  const [period, setPeriod] = useState<Period>(3);
  const [firstMonth, setFirstMonth] = useState(() => addMonths(currentYearMonth(), -1));
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const router = useRouter();

  const months = Array.from({ length: period }, (_, i) => addMonths(firstMonth, i));

  const blockedMonths =
    plan === "free" ? months.filter((m) => m >= freeNewestMonth()) : [];

  const fetchData = useCallback(
    async (ms: string[]) => {
      setLoading(true);
      try {
        const results = await Promise.all(
          ms.map((m) => {
            if (plan === "free" && m >= freeNewestMonth()) {
              return Promise.resolve({ month: m, entries: [] });
            }
            return fetch(`/api/saldos?month=${m}`)
              .then((r) => (r.ok ? r.json() : { entries: [] }))
              .then((res: { entries: { day: number; accSaldo: number }[] }) => ({
                month: m,
                entries: res.entries ?? [],
              }));
          })
        );
        setData(results);
      } finally {
        setLoading(false);
      }
    },
    [plan]
  );

  useEffect(() => {
    // fetchData só altera estado após o await do fetch (fonte externa), não de forma síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    fetchData(months);
  }, [firstMonth, period]);

  const shift = useCallback((delta: number) => {
    setFirstMonth((m) => addMonths(m, delta));
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-canvas border-b border-hairline">
        <div className="flex items-center justify-between px-3 py-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full text-ink hover:bg-surface-strong transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-semibold text-ink">Horizonte de saldos</h1>
          <div className="w-9" />
        </div>

        {/* Period segmented control */}
        <div className="px-4 pb-3">
          <div className="flex rounded-xl bg-surface-strong p-0.5">
            {PERIODS.map((p, i) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-lg transition-all relative",
                  p === period
                    ? "bg-canvas text-destructive shadow-sm"
                    : "text-muted"
                )}
              >
                {/* Vertical separator between unselected adjacent tabs */}
                {i > 0 && p !== period && PERIODS[i - 1] !== period && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-px bg-hairline" />
                )}
                {p} meses
              </button>
            ))}
          </div>
        </div>
      </header>

      <HorizonteGrid
        months={months}
        data={data}
        loading={loading}
        blockedMonths={blockedMonths}
        onUpsell={() => setUpsellOpen(true)}
        onShift={shift}
      />

      <ProUpsellSheet
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        context="horizonte"
      />
    </div>
  );
}
