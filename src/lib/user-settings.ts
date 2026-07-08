import "server-only";

import { identityClient } from "@/lib/identity-client";

// A regra mudou-se pro bfin-backend (ADR-0017); este wrapper é a API pública
// desta fatia para configurações de usuário, por cima de @/lib/identity-client.
export { ProRequiredError } from "@/lib/identity-client";

export function setAutoBaixaDiario(userId: string, enabled: boolean): Promise<void> {
  return identityClient.setAutoBaixaDiario(userId, enabled);
}
