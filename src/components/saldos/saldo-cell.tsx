import { cn } from "@/lib/utils";

function fmtCompact(val: number): string {
  if (val === 0) return "—";
  const abs = Math.abs(val);
  if (abs >= 1000) return (val / 1000).toFixed(1).replace(".", ",") + "k";
  return val.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

// abaixo deste saldo o estado deixa de ser "atenção" (zona do zero) e vira negativo
const CAUTION_FLOOR = -200;

function colorClass(value: number): string {
  if (value === 0) return "bg-surface-soft text-muted";
  if (value > 0) return "bg-feedback-positive-surface text-feedback-positive";
  if (value < CAUTION_FLOOR) return "bg-feedback-negative-surface text-feedback-negative";
  return "bg-feedback-caution-surface text-feedback-caution";
}

interface SaldoCellProps {
  value: number;
}

export function SaldoCell({ value }: SaldoCellProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[52px] h-7 px-2 rounded-md text-xs font-semibold shrink-0",
        colorClass(value)
      )}
    >
      {fmtCompact(value)}
    </span>
  );
}
