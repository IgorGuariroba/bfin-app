import { cn } from "@/lib/utils";
import { fmt } from "@/lib/utils";

interface MetricRowProps {
  label: string;
  value: number;
  sublabel?: string;
  valueColor?: string;
  className?: string;
  large?: boolean;
}

export function MetricRow({
  label,
  value,
  sublabel,
  valueColor,
  className,
  large,
}: MetricRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-2.5", className)}>
      <div className="flex flex-col">
        <span
          className={cn(
            "text-[var(--color-body-text)]",
            large ? "text-sm font-semibold" : "text-sm"
          )}
        >
          {label}
        </span>
        {sublabel && (
          <span className="text-xs text-[var(--color-muted)] mt-0.5">{sublabel}</span>
        )}
      </div>
      <span
        className={cn(
          "font-semibold tabular-nums",
          large ? "text-base" : "text-sm",
          valueColor ?? "text-[var(--color-ink)]"
        )}
      >
        {fmt(value)}
      </span>
    </div>
  );
}
