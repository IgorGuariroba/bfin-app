"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const MONTH_ABBR = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];

/** Mini calendar icon showing today's month + day */
function TodayCalendar() {
  const [today, setToday] = useState<{ m: string; d: number } | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday({ m: MONTH_ABBR[now.getMonth()], d: now.getDate() });
  }, []);

  if (!today) {
    // SSR / hydration placeholder — same dimensions, no text
    return <span className="inline-flex w-7 h-7 rounded-md border border-current" />;
  }

  return (
    <span className="inline-flex flex-col items-center justify-center w-7 h-7 rounded-md border border-current overflow-hidden leading-none">
      <span className="w-full text-center text-[7px] font-bold tracking-wide bg-current">
        <span className="text-canvas">{today.m}</span>
      </span>
      <span className="text-[13px] font-bold leading-tight">{today.d}</span>
    </span>
  );
}

interface MonthHeaderProps {
  month: string; // e.g. "Maio 2026"
  onPrev: () => void;
  onNext: () => void;
  onGridToggle?: () => void;
  className?: string;
}

export function MonthHeader({ month, onPrev, onNext, onGridToggle, className }: MonthHeaderProps) {
  const router = useRouter();

  const handleGrid = () => {
    if (onGridToggle) {
      onGridToggle();
    } else {
      router.push("/horizonte");
    }
  };

  return (
    <header className={cn("sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-canvas border-b border-hairline", className)}>
      <button
        onClick={handleGrid}
        className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-ink transition-colors"
        aria-label="Alternar visualização"
      >
        <TodayCalendar />
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-ink transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-ink min-w-[120px] text-center">{month}</span>
        <button
          onClick={onNext}
          className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-ink transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <button
        onClick={handleGrid}
        className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-ink transition-colors"
        aria-label="Horizonte de saldos"
      >
        <LayoutGrid size={20} />
      </button>
    </header>
  );
}
