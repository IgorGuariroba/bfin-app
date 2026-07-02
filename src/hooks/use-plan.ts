"use client";

import { usePlanContext } from "@/components/providers/plan-provider";
import {
  type Plan,
  freeOldestMonth,
  freeNewestMonth,
  currentYearMonth,
  isMonthAllowed,
} from "@/lib/plan-utils";

export { freeOldestMonth, freeNewestMonth, currentYearMonth };

export function usePlan(): {
  plan: Plan;
  isMonthAllowed: (month: string) => boolean;
  isFutureLocked: (month: string) => boolean;
} {
  const plan = usePlanContext();

  return {
    plan,
    isMonthAllowed: (month) => isMonthAllowed(month, plan),
    isFutureLocked: (month) => plan !== "pro" && month >= freeNewestMonth(),
  };
}
