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

const WEEKDAY_ABBR = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function getWeekdayAbbr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return WEEKDAY_ABBR[dow];
}

const CAT_INITIALS: Record<string, string> = {
  entrada: "E",
  saida: "S",
  diario: "D",
  cartao: "C",
  economia: "G",
};

const POSITIVE = "#2db55d";
const POSITIVE_BG = "rgba(45, 181, 93, 0.10)";
const NEGATIVE_BG = "rgba(255, 56, 92, 0.10)";
const ZERO_BG = "rgba(245, 195, 50, 0.18)";
const ZERO_FG = "#92640a";

function saldoColor(value: number): string {
  if (value > 0) return POSITIVE;
  if (value < 0) return "var(--color-rausch)";
  return ZERO_FG;
}

function saldoBg(value: number): string {
  if (value > 0) return POSITIVE_BG;
  if (value < 0) return NEGATIVE_BG;
  return ZERO_BG;
}

export function DayRow({ entry, filter, isToday, onClick }: DayRowProps) {
  const { day, byType, accSaldo } = entry;

  const typesToShow = filter === "all" ? [...ALL_TYPES] : [filter];

  return (
    <button
      data-today={isToday ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full border-b border-hairline-soft text-left transition-colors",
        "bg-canvas hover:bg-surface-soft/60"
      )}
    >
      {/* Day number + weekday */}
      <div className="w-12 shrink-0 flex flex-col items-center justify-start pt-2 gap-0.5">
        <span
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm tabular-nums leading-none",
            isToday ? "bg-ink text-on-primary font-semibold" : "text-ink font-medium"
          )}
        >
          {day}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.24px] leading-tight text-muted-soft">
          {getWeekdayAbbr(entry.date)}
        </span>
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
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-on-primary shrink-0"
                style={{ backgroundColor: color }}
              >
                {initial}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  value === 0 ? "text-muted-soft" : "text-ink font-medium"
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
        className="w-[140px] shrink-0 flex items-center justify-end pr-3"
        style={{ backgroundColor: saldoBg(accSaldo) }}
      >
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: saldoColor(accSaldo) }}
        >
          {fmt(accSaldo)}
        </span>
      </div>
    </button>
  );
}
