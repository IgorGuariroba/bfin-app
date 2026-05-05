import { prisma } from "@/lib/prisma";
import { DEFAULT_SYSTEM_TAGS } from "@/lib/constants";

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

  const toCreate = DEFAULT_SYSTEM_TAGS.filter(
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
