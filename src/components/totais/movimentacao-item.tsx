import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CAT_COLORS, CAT_LABELS, TYPE_LABELS_FULL } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { Category } from "@/lib/constants";

interface MovimentacaoItemProps {
  tipo: Category;
  total: number;
  month: string;
}

export function MovimentacaoItem({ tipo, total, month }: MovimentacaoItemProps) {
  const color = CAT_COLORS[tipo];
  const label = TYPE_LABELS_FULL[tipo];
  const shortLabel = CAT_LABELS[tipo];

  return (
    <Link
      href={`/movimentacoes/${tipo}?month=${month}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-hairline-soft)] bg-canvas hover:bg-[var(--color-surface-soft)]/60 transition-colors"
    >
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-label={shortLabel}
      />
      <span className="flex-1 text-sm text-[var(--color-body-text)]">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
        {fmt(total)}
      </span>
      <ChevronRight size={16} className="text-[var(--color-muted)] shrink-0" />
    </Link>
  );
}
