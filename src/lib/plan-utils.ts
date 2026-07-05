// Gates de plano free/pro por mês-calendário (ADR-0017): pura, sem dependência
// de repo — duplicada aqui (também existe em core/identity/gates.ts no
// bfin-backend) porque é consumida por client hooks no browser e por rotas
// gateway no servidor, sem round-trip HTTP.
export type Plan = "free" | "pro";

const FREE_HISTORY_MONTHS = 1;
const FREE_FUTURE_MONTHS = 2;

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
