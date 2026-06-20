import "server-only";

import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/plan";

/** Lançada quando um usuário não-`pro` tenta ligar uma feature exclusiva. Mapeada a 403 na rota. */
export class ProRequiredError extends Error {}

/**
 * Liga/desliga a "Baixa automática do gasto diário" (ADR-0005). Ligar exige
 * plano `pro`; desligar é sempre permitido (inclusive após downgrade, para o
 * usuário conseguir sair do estado). Idempotente.
 */
export async function setAutoBaixaDiario(userId: string, enabled: boolean): Promise<void> {
  if (enabled && (await getUserPlan(userId)) !== "pro") {
    throw new ProRequiredError("Baixa automática do gasto diário exige plano pro");
  }
  await prisma.user.update({ where: { id: userId }, data: { autoBaixaDiario: enabled } });
}
