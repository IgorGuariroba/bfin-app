"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  HorizonteGrid,
  addMonths,
  type MonthData,
} from "@/components/horizonte/horizonte-grid";
import { ProUpsellSheet } from "@/components/plan/pro-upsell-sheet";
import { usePlanContext } from "@/components/providers/plan-provider";
import { currentYearMonth, freeNewestMonth } from "@/hooks/use-plan";

export default function HorizontePage() {
  const plan = usePlanContext();
  const [firstMonth, setFirstMonth] = useState(() => addMonths(currentYearMonth(), -1));
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const router = useRouter();

  const months: [string, string, string] = [
    firstMonth,
    addMonths(firstMonth, 1),
    addMonths(firstMonth, 2),
  ];

  // Determine which months are blocked (beyond free limit)
  const blockedMonths = plan === "free"
    ? months.filter((m) => m >= freeNewestMonth())
    : [];

  const fetchData = useCallback(async (ms: [string, string, string]) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ms.map((m) => {
          // Don't fetch blocked months
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
  }, [plan]);

  useEffect(() => {
    fetchData(months);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstMonth]);

  const shift = useCallback((delta: number) => {
    setFirstMonth((m) => {
      const next = addMonths(m, delta);
      // No cap — navigation is free, blocked months show blur
      return next;
    });
  }, []);

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
            onClick={() => shift(3)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-ink hover:bg-hairline-soft transition-colors"
            aria-label="Próximos meses"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <HorizonteGrid
        months={months}
        data={data}
        loading={loading}
        blockedMonths={blockedMonths}
        onUpsell={() => setUpsellOpen(true)}
      />

      <ProUpsellSheet
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        context="horizonte"
      />
    </div>
  );
}
