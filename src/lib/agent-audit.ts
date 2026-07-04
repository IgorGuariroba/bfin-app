import "server-only";

import { apiKeysService } from "@/adapters";
import type { AgentWrite } from "@/core/apikeys";

// A regra mudou-se para o core (ADR-0013); wrapper mantido para os consumidores
// existentes até suas fatias migrarem para @/adapters.
export type { AgentWrite } from "@/core/apikeys";

export function recordAgentWrite(write: AgentWrite): Promise<void> {
  return apiKeysService.recordAgentWrite(write);
}
