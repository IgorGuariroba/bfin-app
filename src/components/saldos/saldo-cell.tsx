import { cn } from "@/lib/utils";

function fmtCompact(val: number): string {
  if (val === 0) return "—";
  const abs = Math.abs(val);
  if (abs >= 1000) return (val / 1000).toFixed(1).replace(".", ",") + "k";
  return val.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function colorClass(value: number): string {
  if (value === 0) return "bg-[var(--color-surface-soft)] text-[var(--color-muted)]";
  if (value > 0) return "bg-[#2db55d]/15 text-[#2db55d]";
  if (value < -200) return "bg-[#ff385c]/15 text-[#ff385c]";
  return "bg-amber-100 text-amber-700";
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
