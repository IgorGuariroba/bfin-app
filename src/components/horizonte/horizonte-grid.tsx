"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type SaldoEntry = {
  day: number;
  accSaldo: number;
};

export type MonthData = {
  month: string; // YYYY-MM
  entries: SaldoEntry[];
};

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${MONTHS[m - 1]}/${String(y).slice(2)}`;
}

/** Color grade based on saldo value */
function cellColor(value: number): { bg: string; text: string } {
  if (value === 0) return { bg: "transparent", text: "var(--muted)" };
  if (value > 0) {
    // Yellow/amber tones – the bigger the value, the more saturated
    if (value >= 1000) return { bg: "#fff3c4", text: "#92400e" };
    if (value >= 500) return { bg: "#fff8dc", text: "#92400e" };
    return { bg: "#fffbeb", text: "#92400e" };
  }
  // Negative: salmon → red → dark red
  const abs = Math.abs(value);
  if (abs < 200) return { bg: "#fef2f2", text: "#b91c1c" };
  if (abs < 500) return { bg: "#fecaca", text: "#b91c1c" };
  if (abs < 1000) return { bg: "#fca5a5", text: "#991b1b" };
  if (abs < 2000) return { bg: "#f87171", text: "#7f1d1d" };
  return { bg: "#ef4444", text: "#ffffff" };
}

function fmtCompact(val: number): string {
  if (val === 0) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1000) {
    const k = abs / 1000;
    return sign + k.toFixed(k >= 10 ? 1 : 2).replace(".", ",") + "K";
  }
  return sign + abs.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

interface HorizonteGridProps {
  months: [string, string, string];
  data: MonthData[];
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onShift: (delta: number) => void;
}

const TODAY = new Date();
const TODAY_MONTH = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
const TODAY_DAY = TODAY.getDate();

export function HorizonteGrid({
  months,
  data,
  loading,
  onShift,
}: HorizonteGridProps) {
  const touchStartX = useRef(0);
  const mouseStartX = useRef(0);
  const isDragging = useRef(false);

  const byMonth: Record<string, Record<number, number>> = {};
  for (const md of data) {
    byMonth[md.month] = {};
    for (const e of md.entries) {
      byMonth[md.month][e.day] = e.accSaldo;
    }
  }

  const daysInMonth = months.map((m) => {
    const [y, mo] = m.split("-").map(Number);
    return new Date(y, mo, 0).getDate();
  });

  const maxDays = Math.max(...daysInMonth);

  return (
    <div
      className="flex flex-col select-none flex-1 overflow-hidden"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) onShift(dx < 0 ? 3 : -3);
      }}
      onMouseDown={(e) => { mouseStartX.current = e.clientX; isDragging.current = true; }}
      onMouseUp={(e) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        const dx = e.clientX - mouseStartX.current;
        if (Math.abs(dx) > 50) onShift(dx < 0 ? 3 : -3);
      }}
      onMouseLeave={() => { isDragging.current = false; }}
    >
      {/* ── Month headers ── */}
      <div className="grid grid-cols-3 border-b border-hairline sticky top-0 z-10 bg-canvas">
        {months.map((m, i) => {
          const isCurrent = m === TODAY_MONTH;
          return (
            <div
              key={m}
              className={cn(
                "py-2.5 text-center text-xs font-bold tracking-wide",
                i < 2 && "border-r border-hairline",
                isCurrent ? "bg-ink text-white" : "text-ink"
              )}
            >
              {monthLabel(m)}{isCurrent ? " ›" : ""}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Carregando...
        </div>
      )}

      {!loading && (
        <div className="overflow-y-auto flex-1">
          {Array.from({ length: maxDays }, (_, i) => i + 1).map((day) => (
            <div key={day} className="grid grid-cols-3 border-b border-hairline-soft">
              {months.map((m, idx) => {
                if (day > daysInMonth[idx]) {
                  return (
                    <div
                      key={m}
                      className={cn("h-8", idx < 2 && "border-r border-hairline-soft")}
                    />
                  );
                }

                const saldo = byMonth[m]?.[day] ?? 0;
                const isToday = m === TODAY_MONTH && day === TODAY_DAY;
                const colors = cellColor(saldo);

                return (
                  <div
                    key={m}
                    className={cn(
                      "flex items-center h-8 px-1.5 text-[11px] font-semibold tabular-nums",
                      idx < 2 && "border-r border-hairline-soft",
                      isToday && "!bg-ink !text-white"
                    )}
                    style={isToday ? undefined : { backgroundColor: colors.bg, color: colors.text }}
                  >
                    <span className={cn(
                      "w-5 text-left text-[10px]",
                      isToday ? "text-white font-bold" : "text-muted-foreground font-medium"
                    )}>
                      {day}
                    </span>
                    <span className="flex-1 text-right">
                      {fmtCompact(saldo)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
