"use client";

import { useState } from "react";
import { MonthHeader } from "@/components/layout/month-header";
import { SaldosGrid } from "@/components/saldos/saldos-grid";
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

  return (
    <div className="flex flex-col">
      <MonthHeader month={label} onPrev={prev} onNext={next} />

      <div className="px-4 py-2 border-b border-[var(--color-hairline-soft)] bg-canvas">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36 h-8 text-sm">
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

      <SaldosGrid
        month={month}
        filter={filter}
        onDayClick={(_date) => {
          // T12 — Day Detail (not yet implemented)
        }}
      />
    </div>
  );
}
