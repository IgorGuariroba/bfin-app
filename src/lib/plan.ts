import "server-only";
import { identityService } from "@/adapters";
import type { Plan } from "@/core/identity";
export {
  type Plan,
  freeOldestMonth,
  isMonthAllowed,
  isFutureMonthAllowed,
} from "@/lib/plan-utils";

// A regra mudou-se para o core (ADR-0013); wrapper mantido para os consumidores
// existentes até suas fatias migrarem para @/adapters.
export function getUserPlan(userId: string): Promise<Plan> {
  return identityService.getUserPlan(userId);
}
