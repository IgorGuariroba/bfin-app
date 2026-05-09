"use client";

import { useState } from "react";
import { MonthHeader } from "@/components/layout/month-header";
import { SaldosGrid } from "@/components/saldos/saldos-grid";
import { DayDetail } from "@/components/transactions/day-detail";
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
  const isNextLocked = isFutureLocked(month);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <MonthHeader
        month={label}
        onPrev={prev}
        onNext={next}
        isNextLocked={isNextLocked}
        onTodayClick={() => {
          const el = document.querySelector("[data-today='true']");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

      {/* Column header: Dia | Filter | Saldos */}
      <div className="sticky top-[61px] z-20 flex items-center px-4 py-2 border-b border-hairline-soft bg-canvas">
        <span className="w-12 shrink-0 text-[11px] font-bold uppercase tracking-[0.32px] text-muted-foreground">
          Dia
        </span>
        <div className="flex-1">
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
        <span className="w-[140px] shrink-0 pr-3 text-right text-[11px] font-bold uppercase tracking-[0.32px] text-muted-foreground">
          Saldos
        </span>
      </div>

      <SaldosGrid
        month={month}
        filter={filter}
        onDayClick={(date) => setSelectedDate(date)}
      />

      <DayDetail
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onNavigate={(date) => setSelectedDate(date)}
      />
    </div>
  );
}
