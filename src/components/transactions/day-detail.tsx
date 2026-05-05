"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, ChevronDown, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useTransactions } from "@/hooks/use-transactions";
import type { Transaction } from "@/hooks/use-transactions";
import { useAddModal } from "@/lib/add-modal-context";
import { CAT_COLORS, CAT_LABELS, CATEGORIES } from "@/lib/constants";
import type { Category } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EditTransactionModal } from "@/components/transactions/edit-transaction-modal";

/* ── Category initials ─────────────────── */
const CAT_INITIALS: Record<string, string> = {
  entrada: "E",
  saida: "S",
  diario: "D",
  cartao: "C",
  economia: "G",
};

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0];
}

function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Short date: dd/MM */
function fmtShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

interface DayDetailProps {
  date: string | null;
  onClose: () => void;
  onNavigate: (date: string) => void;
}

export function DayDetail({ date, onClose, onNavigate }: DayDetailProps) {
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const { setOpen: openAddModal } = useAddModal();

  const queryType = filterTipo === "all" ? undefined : filterTipo;
  const { transactions, loading, refetch } = useTransactions(
    date ? { from: date, to: date, type: queryType } : {}
  );

  const prevDate = date ? addDays(date, -1) : null;
  const nextDate = date ? addDays(date, 1) : null;
  const canPrev = prevDate && date ? isSameMonth(prevDate, date) : false;
  const canNext = nextDate && date ? isSameMonth(nextDate, date) : false;

  const shortDate = useMemo(() => (date ? fmtShortDate(date) : ""), [date]);

  /* Active filter info */
  const filterColor = filterTipo === "all" ? "#6a6a6a" : (CAT_COLORS[filterTipo as Category] ?? "#6a6a6a");
  const filterLabel = filterTipo === "all" ? "Todas" : (CAT_LABELS[filterTipo as Category] ?? "Todas");
  const filterInitial = filterTipo === "all" ? "T" : (CAT_INITIALS[filterTipo] ?? "T");

  return (
    <>
    <Sheet open={!!date} onOpenChange={(o) => { if (!o) { onClose(); setFilterOpen(false); } }}>
      <SheetContent
        side="bottom"
        className="data-[side=bottom]:h-[96dvh] flex flex-col rounded-t-2xl p-0 gap-0"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Detalhe do dia</SheetTitle>

        {/* ─── Header: ← < dd/MM > + ─── */}
        <div className="flex items-center justify-between px-3 py-3 shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-ink transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => canPrev && prevDate && onNavigate(prevDate)}
              disabled={!canPrev}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-ink disabled:opacity-25 transition-colors"
              aria-label="Dia anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-ink min-w-[50px] text-center">
              {shortDate}
            </span>
            <button
              onClick={() => canNext && nextDate && onNavigate(nextDate)}
              disabled={!canNext}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-ink disabled:opacity-25 transition-colors"
              aria-label="Próximo dia"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => openAddModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-ink transition-colors"
            aria-label="Adicionar transação"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* ─── Filter pill ─── */}
        <div className="px-4 pb-3 shrink-0 relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-full border border-hairline-soft bg-surface-soft transition-colors"
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ backgroundColor: filterColor }}
            >
              {filterInitial}
            </span>
            <span className="flex-1 text-sm font-medium text-ink text-left">{filterLabel}</span>
            <ChevronDown size={16} className="text-muted-foreground" />
          </button>

          {filterOpen && (
            <div className="absolute left-4 right-4 top-full z-20 bg-white rounded-xl shadow-lg border border-hairline-soft overflow-hidden mt-1">
              {/* "Todas" option */}
              <button
                onClick={() => { setFilterTipo("all"); setFilterOpen(false); }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-surface-soft transition-colors",
                  filterTipo === "all" && "bg-surface-soft"
                )}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold bg-muted-foreground">
                  T
                </span>
                <span className="text-sm text-ink">Todas</span>
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setFilterTipo(cat); setFilterOpen(false); }}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-surface-soft transition-colors",
                    filterTipo === cat && "bg-surface-soft"
                  )}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                    style={{ backgroundColor: CAT_COLORS[cat] }}
                  >
                    {CAT_INITIALS[cat]}
                  </span>
                  <span className="text-sm text-ink">{CAT_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Transaction list ─── */}
        <div className="flex-1 overflow-y-auto border-t border-hairline-soft">
          {loading && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Carregando...
            </div>
          )}

          {!loading && transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Wallet size={32} className="text-muted-foreground opacity-25" />
              <span className="text-sm text-muted-foreground">Nenhuma movimentação neste dia.</span>
              <button
                onClick={() => openAddModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-rausch text-white text-sm font-semibold mt-1"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <ul className="flex flex-col">
              {transactions.map((tx) => {
                const cat = tx.type as Category;
                const color = CAT_COLORS[cat] ?? "#999";
                const initial = CAT_INITIALS[cat] ?? "?";
                const txDate = typeof tx.date === "string"
                  ? tx.date.slice(0, 10)
                  : new Date(tx.date).toISOString().slice(0, 10);
                const txShort = fmtShortDate(txDate);

                return (
                  <li
                    key={tx.id}
                    onClick={() => setEditingTx(tx)}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-hairline-soft cursor-pointer active:bg-surface-soft transition-colors"
                  >
                    {/* Category circle */}
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {initial}
                    </span>

                    {/* Description + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{txShort}</p>
                    </div>

                    {/* Amount + category label */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-ink">{fmt(tx.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{CAT_LABELS[cat]}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <EditTransactionModal
      transaction={editingTx}
      onClose={() => setEditingTx(null)}
      onUpdated={refetch}
    />
    </>
  );
}
