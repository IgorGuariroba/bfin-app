"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CreditCard, PiggyBank, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { MonthHeader } from "@/components/layout/month-header";
import { useMonth } from "@/hooks/use-month";
import { useTransactions } from "@/hooks/use-transactions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface PageProps {
  params: Promise<{ tipo: string }>;
}

export default function MovimentacoesPage({ params }: PageProps) {
  const { tipo } = use(params);
  const searchParams = useSearchParams();
  const initialMonth = searchParams.get("month") ?? undefined;

  const { month, prev, next, label } = useMonth(initialMonth);
  const [filterTipo, setFilterTipo] = useState<string>(tipo === "all" ? "all" : tipo);

  const queryType = filterTipo === "all" ? undefined : filterTipo;
  const { transactions, loading } = useTransactions({ month, type: queryType });

  const pageTitle =
    tipo === "all" ? "Todas" : (TYPE_LABELS_FULL[tipo as Category] ?? tipo);

  return (
    <div className="flex flex-col">
      <BackHeader title={pageTitle} />
      <MonthHeader month={label} onPrev={prev} onNext={next} />

      {tipo === "all" && (
        <div className="px-4 py-2 border-b border-[var(--color-hairline-soft)]">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {TYPE_LABELS_FULL[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-[var(--color-muted)]">
          Carregando...
        </div>
      )}

      {!loading && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[var(--color-muted)]">
          <Wallet size={32} className="opacity-30" />
          <span className="text-sm">Nenhuma movimentação neste mês.</span>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <ul className="flex flex-col">
          {transactions.map((tx) => {
            const cat = tx.type as Category;
            const color = CAT_COLORS[cat] ?? "#999";
            const Icon = CAT_ICONS[cat] ?? Wallet;
            const dateLabel = new Date(tx.date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            });
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
                  <p className="text-xs text-[var(--color-muted)] capitalize">{dateLabel}</p>
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
  );
}
