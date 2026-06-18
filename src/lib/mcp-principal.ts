import "server-only";

import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-key";
import { getUserPlan } from "@/lib/plan";

export async function resolvePrincipal(
  token: string
): Promise<{ userId: string; apiKeyId: string } | null> {
  const record = await prisma.apiKey.findUnique({
    where: { hashedKey: hashApiKey(token) },
  });
  if (!record || record.revokedAt) return null;

  if ((await getUserPlan(record.userId)) !== "pro") return null;

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return { userId: record.userId, apiKeyId: record.id };
}
