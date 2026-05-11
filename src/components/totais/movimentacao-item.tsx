import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CAT_COLORS, CAT_LABELS } from "@/lib/constants";
import { fmt } from "@/lib/utils";
import type { Category } from "@/lib/constants";

const CAT_INITIALS: Record<string, string> = {
  entrada: "E",
  saida: "S",
  diario: "D",
  cartao: "C",
  economia: "G",
};

interface MovimentacaoItemProps {
  tipo: Category;
  total: number;
  month: string;
}

export function MovimentacaoItem({ tipo, total, month }: MovimentacaoItemProps) {
  const color = CAT_COLORS[tipo];
  const label = CAT_LABELS[tipo] === "Guardado" ? "Economias" : `${CAT_LABELS[tipo]}s`;
  const initial = CAT_INITIALS[tipo] ?? "?";

  return (
    <Link
      href={`/movimentacoes/${tipo}?month=${month}`}
      className="flex items-center gap-3.5 rounded-2xl border border-hairline shadow-sm bg-canvas px-4 py-4 hover:bg-surface-soft/60 transition-colors"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-on-primary text-xs font-semibold shrink-0"
        style={{ backgroundColor: color }}
      >
        {initial}
      </span>
      <span className="flex-1 text-base font-medium text-ink">{label}</span>
      <span className="text-base font-semibold tabular-nums text-ink">
        {fmt(total)}
      </span>
      <ChevronRight size={16} className="text-muted shrink-0" />
    </Link>
  );
}
