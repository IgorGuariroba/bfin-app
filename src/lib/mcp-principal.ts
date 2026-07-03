import "server-only";

import { apiKeysService } from "@/adapters";

// A regra mudou-se para o core (ADR-0013); wrapper mantido para os consumidores
// existentes até suas fatias migrarem para @/adapters.
export function resolvePrincipal(
  token: string
): Promise<{ userId: string; apiKeyId: string } | null> {
  return apiKeysService.resolvePrincipal(token);
}
