import { prisma } from "@/lib/prisma";
import { DEFAULT_SYSTEM_TAGS, CATEGORY_TAGS } from "@/lib/constants";

// Type-mirrors (Entradas/Saídas/...) + categorias canônicas (Transporte/Alimentação/...).
// As categorias dão substância ao suggestTag (#93); o seeding idempotente faz backfill
// em usuários existentes na próxima vez que ensureSystemTags rodar.
const SYSTEM_TAGS = [
  ...DEFAULT_SYSTEM_TAGS.map((t) => ({ name: t.name, color: t.color })),
  ...CATEGORY_TAGS.map((t) => ({ name: t.name, color: t.color })),
];

/**
 * Garante que as tags de sistema existam para o usuário.
 * Cria apenas as que ainda não existem. É idempotente.
 */
export async function ensureSystemTags(userId: string) {
  const existing = await prisma.tag.findMany({
    where: { userId, isSystem: true },
    select: { name: true },
  });

  const existingNames = new Set(existing.map((t) => t.name));

  const toCreate = SYSTEM_TAGS.filter(
    (tag) => !existingNames.has(tag.name)
  );

  if (toCreate.length === 0) return;

  await prisma.tag.createMany({
    data: toCreate.map((tag) => ({
      userId,
      name: tag.name,
      color: tag.color,
      isSystem: true,
    })),
    skipDuplicates: true,
  });
}
