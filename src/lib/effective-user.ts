// Adapter Next da delegação (ADR-0011/ADR-0013): lê os cookies de conta ativa
// e delega a regra "membro ativo opera como dono" ao core (identityService).
import { cookies } from "next/headers";
import { identityService } from "@/adapters";

/** Dono pedido via cookie: `active-account` (sessão) > `preferred-account` (persistente). */
async function requestedOwnerId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("active-account")?.value ?? cookieStore.get("preferred-account")?.value;
}

export async function getEffectiveUserId(sessionUserId: string): Promise<string> {
  return identityService.resolveEffectiveUser(sessionUserId, await requestedOwnerId());
}

export async function getDelegationInfo(sessionUserId: string): Promise<{
  effectiveUserId: string;
  isDelegated: boolean;
  ownerName?: string;
  ownerEmail?: string;
}> {
  return identityService.getDelegationInfo(sessionUserId, await requestedOwnerId());
}
