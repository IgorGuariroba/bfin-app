"use client";

import { useState } from "react";
import { MonthHeader } from "@/components/layout/month-header";
import { SaldosGrid } from "@/components/saldos/saldos-grid";
import { DayDetail } from "@/components/transactions/day-detail";
import { useMonth } from "@/hooks/use-month";
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
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <MonthHeader month={label} onPrev={prev} onNext={next} />

      {/* Column header: Dia | Filter | Saldos */}
      <div className="sticky top-[49px] z-20 flex items-center px-4 py-2 border-b border-[var(--color-hairline-soft)] bg-canvas">
        <span className="w-8 text-xs font-medium text-[var(--color-muted)] shrink-0">
          Dia
        </span>
        <div className="flex-1">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-28 h-7 text-xs border-[var(--color-hairline)] bg-[var(--color-surface-soft)]">
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
        <span className="w-[100px] text-xs font-medium text-[var(--color-muted)] text-right pr-3 shrink-0">
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
