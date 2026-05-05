"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAddModal } from "@/lib/add-modal-context";
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
  const { setOpen: openAddModal } = useAddModal();

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
            .then((r) => (r.ok ? r.json() : []))
            .then((entries: { day: number; accSaldo: number }[]) => ({
              month: m,
              entries,
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
          className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-ink transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold text-ink">Horizonte de saldos</h1>
        <button
          onClick={() => openAddModal(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-ink transition-colors"
          aria-label="Adicionar"
        >
          <Plus size={20} />
        </button>
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
