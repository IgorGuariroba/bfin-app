"use client";

import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateFakeHorizonteEntries } from "@/lib/fake-month-data";

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
  const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return `${MONTHS[m - 1]}/${y}`;
}

function cellColor(value: number): { bg: string; text: string } {
  if (value === 0) return { bg: "#fffbeb", text: "#92400e" };
  if (value > 0) {
    if (value >= 1000) return { bg: "#bbf7d0", text: "#14532d" };
    if (value >= 500)  return { bg: "#dcfce7", text: "#166534" };
    return                    { bg: "#f0fdf4", text: "#166534" };
  }
  const abs = Math.abs(value);
  if (abs < 200)  return { bg: "#fef2f2", text: "#b91c1c" };
  if (abs < 500)  return { bg: "#fecaca", text: "#b91c1c" };
  if (abs < 1000) return { bg: "#fca5a5", text: "#991b1b" };
  if (abs < 2000) return { bg: "#f87171", text: "#7f1d1d" };
  return                 { bg: "#ef4444", text: "#ffffff" };
}

const WEEK_DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function fmtValue(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(abs);
  return `${sign}R$ ${formatted}`;
}

type Cell = { day: number; month: string; overflow: boolean };

function buildCalendarWeeks(month: string): Cell[][] {
  const [y, mo] = month.split("-").map(Number);
  const firstDay = new Date(y, mo - 1, 1);
  const daysInM = new Date(y, mo, 0).getDate();
  const daysInPrev = new Date(y, mo - 1, 0).getDate();
  const prevMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);

  // Mon=0..Sun=6
  const offset = (firstDay.getDay() + 6) % 7;
  const cells: Cell[] = [];

  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: prevMonth, overflow: true });
  }
  for (let d = 1; d <= daysInM; d++) {
    cells.push({ day: d, month, overflow: false });
  }
  const rem = cells.length % 7;
  if (rem > 0) {
    for (let d = 1; d <= 7 - rem; d++) {
      cells.push({ day: d, month: nextMonth, overflow: true });
    }
  }

  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

const TODAY = new Date();
const TODAY_MONTH = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
const TODAY_DAY = TODAY.getDate();

const fakeCache = new Map<string, SaldoEntry[]>();
function getFakeEntries(month: string): SaldoEntry[] {
  if (!fakeCache.has(month)) fakeCache.set(month, generateFakeHorizonteEntries(month));
  return fakeCache.get(month)!;
}

interface HorizonteGridProps {
  months: string[];
  data: MonthData[];
  loading: boolean;
  blockedMonths: string[];
  onUpsell: () => void;
  onShift: (delta: number) => void;
}

export function HorizonteGrid({
  months,
  data,
  loading,
  blockedMonths,
  onUpsell,
  onShift,
}: HorizonteGridProps) {
  const byMonth: Record<string, Record<number, number>> = {};
  for (const md of data) {
    byMonth[md.month] = {};
    for (const e of md.entries) byMonth[md.month][e.day] = e.accSaldo;
  }

  for (const m of blockedMonths) {
    if (!byMonth[m] || Object.keys(byMonth[m]).length === 0) {
      const fake = getFakeEntries(m);
      byMonth[m] = {};
      for (const e of fake) byMonth[m][e.day] = e.accSaldo;
    }
  }

  return (
    <div className="flex flex-col pb-8">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3">
        <LegendItem color="#bbf7d0" label="Saldo positivo" />
        <LegendItem color="#fffbeb" border label="Saldo zerado" />
        <LegendItem color="#fef2f2" label="Atenção (baixo)" />
        <LegendItem color="#ef4444" label="Saldo negativo" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted">
          Carregando...
        </div>
      )}

      {!loading &&
        months.map((m) => {
          const blocked = blockedMonths.includes(m);
          const entries = byMonth[m] ?? {};
          const weeks = buildCalendarWeeks(m);

          return (
            <div key={m} className="mx-4 mb-4 rounded-2xl border border-hairline overflow-hidden bg-canvas">
              {/* Month header */}
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="text-base font-semibold text-ink">{monthLabel(m)}</h2>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onShift(-1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-strong transition-colors text-ink"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => onShift(1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-strong transition-colors text-ink"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-t border-hairline">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="py-1.5 text-center text-[10px] font-medium text-muted uppercase tracking-wide"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div
                className={cn(
                  "grid grid-cols-7 border-t border-hairline",
                  blocked && "blur-[3px] select-none cursor-pointer"
                )}
                onClick={blocked ? onUpsell : undefined}
              >
                {weeks.map((week, wi) =>
                  week.map((cell, di) => {
                    const isToday =
                      !cell.overflow &&
                      cell.month === TODAY_MONTH &&
                      cell.day === TODAY_DAY;
                    const saldo = cell.overflow ? 0 : (entries[cell.day] ?? 0);
                    const colors = cellColor(saldo);

                    return (
                      <div
                        key={`${wi}-${di}`}
                        className={cn(
                          "flex flex-col items-center justify-center min-h-[52px] border-t border-l border-hairline-soft",
                          di === 0 && "border-l-0",
                          wi === 0 && "border-t-0",
                          isToday && !blocked && "!bg-ink"
                        )}
                        style={
                          isToday && !blocked
                            ? undefined
                            : { backgroundColor: cell.overflow ? "#fafafa" : colors.bg }
                        }
                      >
                        <span
                          className={cn(
                            "text-[12px] font-semibold leading-none",
                            cell.overflow
                              ? "text-muted/30"
                              : isToday && !blocked
                              ? "text-on-primary"
                              : "text-ink"
                          )}
                        >
                          {cell.day}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] leading-none mt-0.5 tabular-nums font-medium",
                            cell.overflow
                              ? "text-muted/30"
                              : isToday && !blocked
                              ? "text-on-primary"
                              : undefined
                          )}
                          style={
                            !cell.overflow && !(isToday && !blocked)
                              ? { color: colors.text }
                              : undefined
                          }
                        >
                          {fmtValue(saldo)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {blocked && (
                <button
                  onClick={onUpsell}
                  className="flex w-full items-center justify-center gap-2 py-3 text-sm text-muted border-t border-hairline hover:text-ink transition-colors"
                >
                  <Lock size={13} />
                  <span>Disponível no Pro</span>
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}

function LegendItem({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", border && "border border-hairline")}
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}
