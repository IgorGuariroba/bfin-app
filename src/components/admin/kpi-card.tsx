import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-rausch"
      : tone === "success"
        ? "text-emerald-600"
        : "text-ink";

  return (
    <Card className="rounded-[14px]">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted">{label}</div>
          <Icon size={16} className="text-muted" />
        </div>
        <div className={`text-[28px] font-semibold leading-none ${toneClass}`}>{value}</div>
        {hint && <div className="text-[12px] text-muted">{hint}</div>}
      </CardContent>
    </Card>
  );
}
