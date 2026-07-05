import "server-only";

import { apikeysClient } from "@/lib/apikeys-client";

// A regra mudou-se pro bfin-backend (ADR-0017); wrapper mantido para os
// consumidores existentes até suas fatias migrarem para @/lib/apikeys-client.
export function resolvePrincipal(
  token: string
): Promise<{ userId: string; apiKeyId: string } | null> {
  return apikeysClient.resolvePrincipal(token);
}
