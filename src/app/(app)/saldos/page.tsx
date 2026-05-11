"use client";

import { useState } from "react";
import { MonthHeader } from "@/components/layout/month-header";
import { SaldosGrid } from "@/components/saldos/saldos-grid";
import { DayDetail } from "@/components/transactions/day-detail";
import { ProUpsellSheet } from "@/components/plan/pro-upsell-sheet";
import { useMonth } from "@/hooks/use-month";
import { usePlan } from "@/hooks/use-plan";
import type { DayStatus } from "@/components/saldos/day-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FILTER_OPTIONS = [
  { value: "all", label: "Todas categorias" },
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
  const [todayStatus, setTodayStatus] = useState<DayStatus>("ok");

  const statusColor =
    todayStatus === "ok"      ? "#2db55d" :
    todayStatus === "warning" ? "#f59e0b" :
                                "#ff385c";

  const headerAccent =
    todayStatus === "ok"      ? "border-b-[#2db55d]/70" :
    todayStatus === "warning" ? "border-b-amber-400/60" :
                                "border-b-[#ff385c]/60";

  return (
    <div className="flex flex-col">
      {/* MonthHeader como card flutuante com accent laranja */}
      <MonthHeader
        month={label}
        onPrev={prev}
        onNext={next}
        onTodayClick={() => {
          const el = document.querySelector("[data-today='true']");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        className={`mx-3 mt-2 rounded-2xl border border-hairline shadow-sm border-b-2 ${headerAccent}`}
        accentColor={statusColor}
      />

      {/* Row 2: Dia | filtro (some com scroll) */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-canvas">
        <span className="text-sm font-bold text-ink">
          Dia
        </span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-auto min-w-[160px] px-4 text-sm font-medium rounded-full border border-hairline bg-canvas text-ink focus:ring-0 gap-2">
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

      {/* Row 3 não-sticky: legenda dots (some com scroll) */}
      <div className="flex items-center gap-4 px-4 pb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2db55d]" /> Positivo
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Zero
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-rausch)]" /> Negativo
        </span>
      </div>

      <SaldosGrid
        month={month}
        filter={filter}
        isBlocked={isBlocked}
        onUpsell={() => setUpsellOpen(true)}
        onDayClick={(date) => setSelectedDate(date)}
        onTodayStatus={setTodayStatus}
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
