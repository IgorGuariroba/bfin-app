// Os gates de plano são domínio e mudaram-se para o core (ADR-0013); re-export
// mantido para os consumidores existentes (inclusive client hooks) até suas
// fatias migrarem.
export {
  FREE_HISTORY_MONTHS,
  FREE_FUTURE_MONTHS,
  type Plan,
  freeOldestMonth,
  freeNewestMonth,
  currentYearMonth,
  isMonthAllowed,
  isFutureMonthAllowed,
} from "@/core/identity";
