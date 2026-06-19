import "server-only";

import { prisma } from "@/lib/prisma";
import { ensureSystemTags } from "@/lib/seed-system-tags";
import type { Tag } from "@/generated/prisma/client";

export class TagValidationError extends Error {}

/** Cor neutra default quando o agente não informa uma — Tags do agente são funcionais, não decorativas. */
const DEFAULT_TAG_COLOR = "#94a3b8";

export interface CreateTagInput {
  userId: string;
  name: string;
  color?: string;
}

/**
 * Cria uma Tag do domínio do User (ADR-0004). Espelha a validação de POST /api/tags:
 * nome único por usuário; nome duplicado vira TagValidationError (o handler MCP a
 * converte em tool error). Sempre isSystem=false — só o seeding cria system tags.
 */
export async function createTag({ userId, name, color }: CreateTagInput): Promise<Tag> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new TagValidationError("Nome da Tag é obrigatório.");
  }
  // Mesmos limites de POST /api/tags — o caminho do agente não pode aceitar o que
  // a UI rejeita (ADR-0004 §1: write rápido em troca de casar a validação de domínio).
  if (trimmed.length > 50) {
    throw new TagValidationError("Nome da Tag muito longo (máx. 50).");
  }
  const resolvedColor = color ?? DEFAULT_TAG_COLOR;
  if (resolvedColor.length < 4 || resolvedColor.length > 30) {
    throw new TagValidationError("Cor da Tag inválida.");
  }

  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId, name: trimmed } },
  });
  if (existing) {
    throw new TagValidationError(`Tag "${trimmed}" já existe.`);
  }

  return prisma.tag.create({
    data: { userId, name: trimmed, color: resolvedColor, isSystem: false },
  });
}

/**
 * Lista as Tags do usuário (somente leitura). Semeia as system tags antes de ler,
 * como GET /api/tags, para o agente enxergar a taxonomia canônica (#93). System
 * tags primeiro, depois alfabético.
 */
export async function listTags(userId: string): Promise<Tag[]> {
  await ensureSystemTags(userId);
  return prisma.tag.findMany({
    where: { userId },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}
