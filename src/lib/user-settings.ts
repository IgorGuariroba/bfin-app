import "server-only";

import { identityService } from "@/adapters";

// A regra mudou-se para o core (ADR-0013); wrapper mantido para os consumidores
// existentes até suas fatias migrarem para @/adapters.
export { ProRequiredError } from "@/core/identity";

export function setAutoBaixaDiario(userId: string, enabled: boolean): Promise<void> {
  return identityService.setAutoBaixaDiario(userId, enabled);
}
