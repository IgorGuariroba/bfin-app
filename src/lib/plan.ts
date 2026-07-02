import "server-only";
import { identityService } from "@/adapters";
import type { Plan } from "@/core/identity";
export {
  FREE_HISTORY_MONTHS,
  FREE_FUTURE_MONTHS,
  type Plan,
  freeOldestMonth,
  freeNewestMonth,
  currentYearMonth,
  isMonthAllowed,
  isFutureMonthAllowed,
} from "@/lib/plan-utils";

// A regra mudou-se para o core (ADR-0013); wrapper mantido para os consumidores
// existentes até suas fatias migrarem para @/adapters.
export function getUserPlan(userId: string): Promise<Plan> {
  return identityService.getUserPlan(userId);
}
