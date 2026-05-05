"use client";

import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthHeaderProps {
  month: string; // e.g. "Maio 2026"
  onPrev: () => void;
  onNext: () => void;
  onGridToggle?: () => void;
  className?: string;
}

export function MonthHeader({ month, onPrev, onNext, onGridToggle, className }: MonthHeaderProps) {
  return (
    <header className={cn("flex items-center justify-between px-4 py-3 bg-canvas border-b border-hairline", className)}>
      <button
        onClick={onGridToggle}
        className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-ink transition-colors"
        aria-label="Alternar visualização"
      >
        <CalendarDays size={20} />
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
        onClick={onGridToggle}
        className="flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-ink transition-colors"
        aria-label="Grade"
      >
        <LayoutGrid size={20} />
      </button>
    </header>
  );
}
