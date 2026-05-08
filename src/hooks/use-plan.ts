"use client";

import { usePlanContext } from "@/components/providers/plan-provider";
import type { Plan } from "@/lib/plan";

export function freeOldestMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function usePlan(): { plan: Plan; isMonthAllowed: (month: string) => boolean } {
  const plan = usePlanContext();

  function isMonthAllowed(month: string): boolean {
    if (plan === "pro") return true;
    return month >= freeOldestMonth();
  }

  return { plan, isMonthAllowed };
}
