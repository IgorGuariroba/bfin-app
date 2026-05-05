"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaldoEntry = {
  day: number;
  accSaldo: number;
};

export type MonthData = {
  month: string; // YYYY-MM
  entries: SaldoEntry[];
};

function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const name = d.toLocaleDateString("pt-BR", { month: "short" });
  const currentYear = new Date().getFullYear();
  const suffix = y !== currentYear ? ` ${String(y).slice(2)}` : "";
  return name.replace(".", "") + suffix;
}

function cellBg(value: number, isToday: boolean): string {
  if (isToday) return "bg-[var(--color-ink)] text-white";
  if (value === 0) return "bg-transparent text-[var(--color-muted)]";
  if (value > 0) return "bg-[#2db55d]/15 text-[#2db55d]";
  if (value > -200) return "bg-amber-100 text-amber-700";
  return "bg-[#ff385c]/15 text-[#ff385c]";
}

function fmtCompact(val: number): string {
  if (val === 0) return "—";
  const abs = Math.abs(val);
  if (abs >= 1000) return (val / 1000).toFixed(1).replace(".", ",") + "k";
  return val.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

interface HorizonteGridProps {
  months: [string, string, string]; // 3 consecutive months
  data: MonthData[];
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onShift: (delta: number) => void; // swipe callback
}

const TODAY = new Date();
const TODAY_MONTH = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}`;
const TODAY_DAY = TODAY.getDate();

export function HorizonteGrid({
  months,
  data,
  loading,
  onPrev,
  onNext,
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

  return (
    <div
      className="flex flex-col select-none"
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
      {/* Month headers */}
      <div className="grid grid-cols-[28px_1fr_1fr_1fr] border-b border-[var(--color-hairline-soft)] bg-canvas sticky top-0 z-10">
        <button
          onClick={onPrev}
          className="flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          aria-label="Meses anteriores"
        >
          <ChevronLeft size={16} />
        </button>
        {months.map((m) => (
          <div
            key={m}
            className={cn(
              "py-2 text-center text-xs font-semibold uppercase tracking-wider",
              m === TODAY_MONTH
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-muted)]"
            )}
          >
            {monthLabel(m)}
          </div>
        ))}
        <button
          onClick={onNext}
          className="absolute right-0 top-0 h-full flex items-center justify-center px-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          aria-label="Próximos meses"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-[var(--color-muted)]">
          Carregando...
        </div>
      )}

      {!loading && (
        <div className="overflow-y-auto">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const hasAny = months.some((m, idx) => day <= daysInMonth[idx]);
            if (!hasAny) return null;

            return (
              <div
                key={day}
                className="grid grid-cols-[28px_1fr_1fr_1fr] border-b border-[var(--color-hairline-soft)]"
              >
                <span
                  className={cn(
                    "flex items-center justify-center text-xs tabular-nums py-2",
                    months.some((m) => m === TODAY_MONTH && day === TODAY_DAY)
                      ? "font-bold text-[var(--color-ink)]"
                      : "text-[var(--color-muted)]"
                  )}
                >
                  {day}
                </span>
                {months.map((m, idx) => {
                  if (day > daysInMonth[idx]) {
                    return <div key={m} />;
                  }
                  const saldo = byMonth[m]?.[day] ?? 0;
                  const isToday = m === TODAY_MONTH && day === TODAY_DAY;
                  return (
                    <div
                      key={m}
                      className={cn(
                        "flex items-center justify-center text-[11px] font-semibold tabular-nums py-2 mx-0.5 my-0.5 rounded",
                        cellBg(saldo, isToday)
                      )}
                    >
                      {fmtCompact(saldo)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { addMonths };
