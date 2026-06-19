import "server-only";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type AgentAction = "create" | "update" | "delete";

export interface AgentWrite {
  apiKeyId: string;
  userId: string;
  action: AgentAction;
  entityId: string;
}

/**
 * Trilha de auditoria de uma escrita do agente (ADR-0004): emite log estruturado
 * (apiKeyId/userId/action/entityId) e carimba ApiKey.lastUsedAt. Como o delete é
 * físico e irreversível, este log é a rede de segurança que torna toda escrita
 * rastreável. Vive fora do transactions-service (que é compartilhado com REST e
 * não conhece ApiKey) — o handler MCP a chama após cada create/update/delete.
 */
export async function recordAgentWrite({
  apiKeyId,
  userId,
  action,
  entityId,
}: AgentWrite): Promise<void> {
  logger.info({ apiKeyId, userId, action, entityId }, "agent write");
  try {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  } catch (err) {
    // O bump de lastUsedAt é bookkeeping; a escrita já foi efetivada (o delete é
    // físico e irreversível — ADR-0004). Uma falha aqui não deve estourar para o
    // agente como se a operação tivesse falhado. O log acima já preservou a trilha.
    logger.warn({ apiKeyId, err }, "failed to bump ApiKey.lastUsedAt");
  }
}
