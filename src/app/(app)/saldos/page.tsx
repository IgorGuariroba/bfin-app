"use client";

import { useState } from "react";
import { MonthHeader } from "@/components/layout/month-header";
import { SaldosGrid } from "@/components/saldos/saldos-grid";
import { DayDetail } from "@/components/transactions/day-detail";
import { ProUpsellSheet } from "@/components/plan/pro-upsell-sheet";
import { useMonth } from "@/hooks/use-month";
import { usePlan } from "@/hooks/use-plan";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "entrada", label: "Entradas" },
  { value: "saida", label: "Saídas" },
  { value: "diario", label: "Diário" },
  { value: "cartao", label: "Cartão" },
  { value: "economia", label: "Guardado" },
];

export default function SaldosPage() {
  const { month, prev, next, label } = useMonth();
  const { isFutureLocked } = usePlan();
  const isBlocked = isFutureLocked(month);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <MonthHeader
        month={label}
        onPrev={prev}
        onNext={next}
        onTodayClick={() => {
          const el = document.querySelector("[data-today='true']");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

      {/* Filter bar */}
      <div className="sticky top-[61px] z-20 flex items-center gap-3 px-4 py-2 border-b border-hairline-soft bg-canvas">
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2db55d]" /> Positivo
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Zero
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-rausch)]" /> Negativo
          </span>
        </div>
        <div className="ml-auto">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-28 h-8 text-sm font-medium rounded-lg border-hairline bg-canvas text-ink focus:border-ink focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <SaldosGrid
        month={month}
        filter={filter}
        isBlocked={isBlocked}
        onUpsell={() => setUpsellOpen(true)}
        onDayClick={(date) => setSelectedDate(date)}
      />

      <DayDetail
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onNavigate={(date) => setSelectedDate(date)}
      />

      <ProUpsellSheet
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        context="saldos"
      />
    </div>
  );
}
