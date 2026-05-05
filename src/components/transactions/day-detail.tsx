"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, ArrowDown, ArrowUp, CreditCard, PiggyBank, Wallet, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions } from "@/hooks/use-transactions";
import { useAddModal } from "@/lib/add-modal-context";
import { CAT_COLORS, TYPE_LABELS_FULL, CATEGORIES } from "@/lib/constants";
import type { Category } from "@/lib/constants";
import { fmt } from "@/lib/utils";

const CAT_ICONS: Record<string, LucideIcon> = {
  entrada: ArrowUp,
  saida: ArrowDown,
  diario: Wallet,
  cartao: CreditCard,
  economia: PiggyBank,
};

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0];
}

function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

function fmtDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

interface DayDetailProps {
  date: string | null;
  onClose: () => void;
  onNavigate: (date: string) => void;
}

import { useTags } from "@/hooks/use-tags";

export function DayDetail({ date, onClose, onNavigate }: DayDetailProps) {
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const { setOpen: openAddModal } = useAddModal();
  const { tags } = useTags();

  const queryType = filterTipo === "all" ? undefined : filterTipo;
  const queryTag = filterTag === "all" ? undefined : filterTag;
  const { transactions, loading } = useTransactions(
    date ? { from: date, to: date, type: queryType, tagId: queryTag } : {}
  );

  const prevDate = date ? addDays(date, -1) : null;
  const nextDate = date ? addDays(date, 1) : null;
  const canPrev = prevDate && date ? isSameMonth(prevDate, date) : false;
  const canNext = nextDate && date ? isSameMonth(nextDate, date) : false;

  const dateLabel = useMemo(() => (date ? fmtDateLabel(date) : ""), [date]);

  return (
    <Sheet open={!!date} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[75vh] flex flex-col rounded-t-2xl p-0 gap-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-3 border-b border-[var(--color-hairline-soft)] shrink-0">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => canPrev && prevDate && onNavigate(prevDate)}
              disabled={!canPrev}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-30 transition-colors"
              aria-label="Dia anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-semibold text-[var(--color-ink)] capitalize min-w-[140px] text-center">
              {dateLabel}
            </span>
            <button
              onClick={() => canNext && nextDate && onNavigate(nextDate)}
              disabled={!canNext}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] disabled:opacity-30 transition-colors"
              aria-label="Próximo dia"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            onClick={() => openAddModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            aria-label="Adicionar transação"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 px-4 py-2 border-b border-[var(--color-hairline-soft)] shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[140px] shrink-0 h-8 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {TYPE_LABELS_FULL[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {tags.length > 0 && (
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[140px] shrink-0 h-8 text-sm">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-sm text-[var(--color-muted)]">
              Carregando...
            </div>
          )}

          {!loading && transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Wallet size={32} className="text-[var(--color-muted)] opacity-30" />
              <span className="text-sm text-[var(--color-muted)]">Nenhuma movimentação neste dia.</span>
              <button
                onClick={() => openAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-rausch)] text-white text-sm font-semibold"
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
                const Icon = CAT_ICONS[cat] ?? Wallet;
                return (
                  <li
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-hairline-soft)]"
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-ink)] truncate">{tx.description}</p>
                      {tx.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {tx.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className="text-sm font-semibold tabular-nums shrink-0"
                      style={{ color }}
                    >
                      {fmt(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
