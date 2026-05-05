"use client";

import { CAT_COLORS } from "@/lib/constants";
import { cn, fmt } from "@/lib/utils";

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

const ALL_TYPES = ["entrada", "saida", "diario", "cartao", "economia"] as const;

const CAT_INITIALS: Record<string, string> = {
  entrada: "E",
  saida: "S",
  diario: "D",
  cartao: "C",
  economia: "G",
};

function saldoColor(value: number): string {
  if (value > 0) return "#2db55d";
  if (value < 0) return "#ff385c";
  return "var(--color-muted)";
}

function saldoBg(value: number): string {
  if (value > 0) return "rgba(45, 181, 93, 0.08)";
  if (value < 0) return "rgba(255, 56, 92, 0.08)";
  return "transparent";
}

export function DayRow({ entry, filter, isToday, onClick }: DayRowProps) {
  const { day, byType, accSaldo } = entry;

  const typesToShow = filter === "all" ? [...ALL_TYPES] : [filter];

  return (
    <button
      data-today={isToday ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full border-b border-[var(--color-hairline-soft)] text-left transition-colors",
        isToday
          ? "bg-[var(--color-surface-soft)]"
          : "bg-canvas hover:bg-[var(--color-surface-soft)]/60"
      )}
    >
      {/* Day number */}
      <div
        className={cn(
          "w-8 shrink-0 flex items-start justify-center pt-3 text-sm tabular-nums",
          isToday
            ? "font-bold text-primary"
            : "font-medium text-[var(--color-ink)]"
        )}
      >
        {day}
      </div>

      {/* Category values column */}
      <div className="flex-1 flex flex-col py-1.5 gap-0.5 min-w-0">
        {typesToShow.map((type) => {
          const value = byType[type] ?? 0;
          const color = CAT_COLORS[type as keyof typeof CAT_COLORS] ?? "#999";
          const initial = CAT_INITIALS[type] ?? "?";

          return (
            <div key={type} className="flex items-center gap-2 h-[26px] px-1">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                {initial}
              </span>
              <span
                className={cn(
                  "text-[13px] tabular-nums",
                  value === 0
                    ? "text-[var(--color-muted-soft)]"
                    : "text-[var(--color-ink)] font-medium"
                )}
              >
                {fmt(value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Saldo column */}
      <div
        className="w-[100px] shrink-0 flex items-center justify-end pr-3"
        style={{ backgroundColor: saldoBg(accSaldo) }}
      >
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={{ color: saldoColor(accSaldo) }}
        >
          {fmt(accSaldo)}
        </span>
      </div>
    </button>
  );
}
