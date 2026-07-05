import "server-only";

// Adapter Next da delegação (ADR-0011/ADR-0017): lê os cookies de conta ativa
// e delega a regra "membro ativo opera como dono" ao bfin-backend via gateway.
import { cookies } from "next/headers";
import { identityClient, type DelegationInfo } from "@/lib/identity-client";

/** Dono pedido via cookie: `active-account` (sessão) > `preferred-account` (persistente). */
async function requestedOwnerId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("active-account")?.value ?? cookieStore.get("preferred-account")?.value;
}

export async function getEffectiveUserId(sessionUserId: string): Promise<string> {
  const { effectiveUserId } = await identityClient.getDelegationInfo(
    sessionUserId,
    await requestedOwnerId()
  );
  return effectiveUserId;
}

export async function getDelegationInfo(sessionUserId: string): Promise<DelegationInfo> {
  return identityClient.getDelegationInfo(sessionUserId, await requestedOwnerId());
}
