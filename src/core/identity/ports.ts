import type { MembershipOwner, PlanInfo } from "./types";

/**
 * Porta de persistência do agregado Identidade (ADR-0013). O contrato é
 * moldado pelo que o service precisa — não é um CRUD genérico.
 */
export interface IdentityRepo {
  /** null quando o usuário não existe. */
  findPlanInfo(userId: string): Promise<PlanInfo | null>;
  /** Downgrade persistente do pro vencido (getUserPlan é quem decide). */
  setPlanFree(userId: string): Promise<void>;
  setAutoBaixaDiario(userId: string, enabled: boolean): Promise<void>;
  /**
   * Dono da delegação quando existe AccountMember ativo ownerId←memberId
   * (ADR-0011); null quando não há vínculo ativo.
   */
  findActiveMembershipOwner(ownerId: string, memberId: string): Promise<MembershipOwner | null>;
}
