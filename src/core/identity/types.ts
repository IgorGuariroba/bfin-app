export type Plan = "free" | "pro";

/** O que o resolvedor de plano precisa ler do User (ADR-0013: tipos à mão). */
export interface PlanInfo {
  plan: string;
  planExpiresAt: Date | null;
}

/** Dono de uma delegação ativa (ADR-0011), como a UI exibe o "operando como". */
export interface MembershipOwner {
  name: string;
  email: string;
}

export interface DelegationInfo {
  effectiveUserId: string;
  isDelegated: boolean;
  ownerName?: string;
  ownerEmail?: string;
}
