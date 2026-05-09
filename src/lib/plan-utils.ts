export const FREE_HISTORY_MONTHS = 1;
export const FREE_FUTURE_MONTHS = 2;

export type Plan = "free" | "pro";

export function freeOldestMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - (FREE_HISTORY_MONTHS - 1), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function freeNewestMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + FREE_FUTURE_MONTHS, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function isMonthAllowed(month: string, plan: Plan): boolean {
  if (plan === "pro") return true;
  return month >= freeOldestMonth();
}

export function isFutureMonthAllowed(month: string, plan: Plan): boolean {
  if (plan === "pro") return true;
  return month <= freeNewestMonth();
}
