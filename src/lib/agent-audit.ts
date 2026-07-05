import "server-only";

import { apikeysClient, type AgentWrite } from "@/lib/apikeys-client";

// A regra mudou-se pro bfin-backend (ADR-0017); wrapper mantido para os
// consumidores existentes até suas fatias migrarem para @/lib/apikeys-client.
export type { AgentWrite } from "@/lib/apikeys-client";

export function recordAgentWrite(write: AgentWrite): Promise<void> {
  return apikeysClient.recordAgentWrite(write);
}
