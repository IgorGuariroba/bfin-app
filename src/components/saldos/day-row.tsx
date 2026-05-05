"use client";

import { SaldoCell } from "./saldo-cell";
import { CAT_COLORS, CAT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type DayEntry = {
  day: number;
  date: string;
  byType: Record<string, number>;
  accSaldo: number;
};

interface DayRowProps {
  entry: DayEntry;
  filter: string;
  isToday: boolean;
  onClick: () => void;
}

function fmtAmt(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(1).replace(".", ",") + "k";
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

const ALL_TYPES = ["entrada", "saida", "diario", "cartao", "economia"] as const;

export function DayRow({ entry, filter, isToday, onClick }: DayRowProps) {
  const { day, byType, accSaldo } = entry;

  const typesToShow = filter === "all"
    ? ALL_TYPES.filter((t) => (byType[t] ?? 0) > 0)
    : (byType[filter] ?? 0) > 0 ? [filter] : [];

  const hasAny = typesToShow.length > 0;

  return (
    <button
      data-today={isToday ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-4 py-2.5 gap-3 border-b border-[var(--color-hairline-soft)] text-left transition-colors",
        isToday ? "bg-[var(--color-surface-soft)]" : "bg-canvas hover:bg-[var(--color-surface-soft)]/60"
      )}
    >
      <span
        className={cn(
          "w-6 text-sm shrink-0 tabular-nums",
          isToday ? "font-bold text-primary" : "font-medium text-[var(--color-ink)]",
          !hasAny && "text-[var(--color-muted)]"
        )}
      >
        {day}
      </span>

      <div className="flex-1 flex flex-wrap gap-1 min-h-[24px] items-center">
        {typesToShow.map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: CAT_COLORS[type as keyof typeof CAT_COLORS] }}
            title={CAT_LABELS[type as keyof typeof CAT_LABELS]}
          >
            {fmtAmt(byType[type] ?? 0)}
          </span>
        ))}
        {!hasAny && (
          <span className="text-xs text-[var(--color-muted)]">—</span>
        )}
      </div>

      <SaldoCell value={accSaldo} />
    </button>
  );
}
