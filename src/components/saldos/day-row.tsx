"use client";

import { useState } from "react";
import {
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  TrendingDownIcon,
} from "lucide-react";
import { CAT_COLORS, CAT_LABELS } from "@/lib/constants";
import { cn, fmt } from "@/lib/utils";

export type DayStatus = "ok" | "warning" | "risk";

export type DayEntry = {
  day: number;
  date: string;
  byType: Record<string, number>;
  accSaldo: number;
  status?: DayStatus;
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

const CAT_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  entrada: TrendingUp,
  saida: TrendingDown,
  diario: ShoppingBag,
  cartao: CreditCard,
  economia: PiggyBank,
};

const VISIBLE_COUNT = 3;

const STATUS_COLORS = {
  ok:      { border: "#2db55d", bg: "rgba(45,181,93,0.05)",   icon: "#2db55d", saldo: "#2db55d",  cardBg: "rgba(45,181,93,0.08)"  },
  warning: { border: "#f59e0b", bg: "rgba(245,158,11,0.05)",  icon: "#f59e0b", saldo: "#d97706",  cardBg: "rgba(245,158,11,0.08)" },
  risk:    { border: "#ff385c", bg: "rgba(255,56,92,0.05)",   icon: "#ff385c", saldo: "#ff385c",  cardBg: "rgba(255,56,92,0.08)"  },
};

function StatusCircle({ status }: { status: DayStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className="flex items-center justify-center w-7 h-7 rounded-full shadow-sm"
      style={{ backgroundColor: c.icon }}
    >
      {status === "ok"
        ? <Check size={14} color="white" strokeWidth={3} />
        : <AlertCircle size={14} color="white" strokeWidth={2.5} />
      }
    </span>
  );
}

function StatusBadge({ status }: { status: DayStatus }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#2db55d]/40 text-[#2db55d] bg-white">
        <Check size={10} strokeWidth={3} />
        Tudo certo
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-400/40 text-amber-600 bg-white">
        <AlertCircle size={10} />
        Atenção
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[#ff385c]/40 text-[#ff385c] bg-white">
      <AlertCircle size={10} />
      Risco
    </span>
  );
}

export function DayRow({ entry, filter, isToday, onClick }: DayRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { day, byType, accSaldo } = entry;
  const status: DayStatus = entry.status ?? (accSaldo > 0 ? "ok" : accSaldo === 0 ? "warning" : "risk");
  const c = STATUS_COLORS[status];

  const typesToShow = filter === "all" ? [...ALL_TYPES] : [filter as typeof ALL_TYPES[number]];
  const hiddenCount = typesToShow.length > VISIBLE_COUNT ? typesToShow.length - VISIBLE_COUNT : 0;
  const visibleTypes = expanded || hiddenCount === 0 ? typesToShow : typesToShow.slice(0, VISIBLE_COUNT);

  const hasDisclaimer = status === "warning" || status === "risk";

  return (
    <div
      data-today={isToday ? "true" : undefined}
      className="relative mx-5 my-2"
    >
      {/* Card */}
      <div
        className="relative rounded-2xl border bg-canvas overflow-hidden"
        style={{ borderColor: c.border }}
      >
        {/* Main row — div, não button, pois contém button interno */}
        <div
          onClick={onClick}
          className="w-full flex cursor-pointer transition-colors hover:bg-surface-soft/40"
        >
          {/* Day block + vertical accent bar */}
          <div className="flex shrink-0 items-stretch">
            <div
              className={cn("flex flex-col items-center justify-center w-14 px-1 py-3", isToday && "rounded-l-2xl")}
              style={isToday ? { backgroundColor: c.border } : undefined}
            >
              <span className={cn("text-[10px] font-light uppercase tracking-wide leading-none", isToday ? "text-white/70" : "text-muted-foreground")}>
                {getWeekdayAbbr(entry.date)}
              </span>
              <span className={cn("text-[28px] font-bold leading-tight tabular-nums", isToday ? "text-white" : "text-ink/80")}>
                {day}
              </span>
            </div>
            <div className="w-px self-stretch my-2 rounded-full" style={{ backgroundColor: isToday ? "var(--canvas)" : c.border }} />
          </div>

          {/* Categories + saldo */}
          <div className="flex flex-1 gap-2 min-w-0 px-3 py-3">
            {/* Category list */}
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              {visibleTypes.map((type) => {
                const value = byType[type] ?? 0;
                const color = CAT_COLORS[type as keyof typeof CAT_COLORS] ?? "#999";
                const label = CAT_LABELS[type as keyof typeof CAT_LABELS] ?? type;
                const Icon = CAT_ICONS[type] ?? TrendingUp;
                return (
                  <div key={type} className="flex items-center gap-2 h-[26px]">
                    <span
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}22` }}
                    >
                      <Icon size={12} style={{ color }} />
                    </span>
                    <span className="text-sm text-ink/70 truncate">{label}</span>
                    <span className={cn("ml-auto text-sm tabular-nums shrink-0", value === 0 ? "text-muted-foreground" : "text-ink font-medium")}>
                      {fmt(value)}
                    </span>
                  </div>
                );
              })}

              {/* Expand/collapse */}
              {hiddenCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-ink transition-colors w-fit mt-0.5"
                >
                  {expanded
                    ? <><ChevronUp size={13} /> Menos</>
                    : <><ChevronDown size={13} />+{hiddenCount} {hiddenCount === 1 ? "categoria" : "categorias"}</>
                  }
                </button>
              )}

              {/* Disclaimer */}
              {hasDisclaimer && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium" style={{ color: c.saldo }}>
                  <TrendingDownIcon size={12} />
                  {status === "warning" ? "Saldo zerado neste dia" : "Risco de faltar dinheiro"}
                </div>
              )}
            </div>

            {/* Saldo card */}
            <div
              className="shrink-0 w-[118px] rounded-xl flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 self-stretch"
              style={{ backgroundColor: c.cardBg }}
            >
              <span className="text-[10px] font-medium text-muted-foreground leading-none text-center">
                Saldo do dia
              </span>
              <span
                className="text-[15px] font-bold tabular-nums text-center leading-snug"
                style={{ color: c.saldo }}
              >
                {fmt(accSaldo)}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

      </div>

      {/* Status icon overlapping left border, near top */}
      <div className="absolute top-3 -left-3.5 z-10">
        <StatusCircle status={status} />
      </div>
    </div>
  );
}
