import "server-only";
import { identityClient } from "@/lib/identity-client";
import type { Plan } from "@/lib/plan-utils";
export {
  type Plan,
  freeOldestMonth,
  isMonthAllowed,
  isFutureMonthAllowed,
} from "@/lib/plan-utils";

// A regra mudou-se pro bfin-backend (ADR-0017); este wrapper é a API pública
// desta fatia para consultar o plano, por cima de @/lib/identity-client.
export function getUserPlan(userId: string): Promise<Plan> {
  return identityClient.getUserPlan(userId);
}
