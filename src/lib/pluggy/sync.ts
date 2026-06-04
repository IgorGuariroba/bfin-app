import "server-only";
import { prisma } from "@/lib/prisma";
import { getItem, listAccounts, listTransactions } from "./client";
import { mapPluggyTransaction } from "./map-transaction";

const DEFAULT_TAG_COLOR = "#6a6a6a";

/**
 * Garante que o PluggyItem exista/atualizado no nosso banco.
 * Chamado no item/created e item/updated. Busca os dados frescos do Item
 * (recomendação da Pluggy: sempre GET /items/{id} ao processar eventos).
 */
export async function ensurePluggyItem(
  itemId: string,
  userId: string,
  connectedByUserId: string
): Promise<void> {
  const item = await getItem(itemId);
  await prisma.pluggyItem.upsert({
    where: { itemId },
    create: {
      itemId,
      userId,
      connectedByUserId,
      connector: item.connector?.name ?? "Banco",
      status: item.status,
      lastSyncedAt: new Date(),
    },
    update: {
      status: item.status,
      lastSyncedAt: new Date(),
    },
  });
}

/** Resolve o userId dono de um Item já registrado. */
async function resolveUserId(itemId: string): Promise<string | null> {
  const item = await prisma.pluggyItem.findUnique({
    where: { itemId },
    select: { userId: true },
  });
  return item?.userId ?? null;
}

/** Encontra ou cria uma Tag (não-sistema) para a categoria do Pluggy. */
async function resolveCategoryTagId(userId: string, category: string): Promise<string> {
  const existing = await prisma.tag.findUnique({
    where: { userId_name: { userId, name: category } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.tag.create({
    data: { userId, name: category, color: DEFAULT_TAG_COLOR, isSystem: false },
    select: { id: true },
  });
  return created.id;
}

/**
 * Sincroniza as transactions de um Item para o domínio bfin.
 * Idempotente: upsert por externalId — retries de webhook (até 9x) não duplicam.
 */
export async function syncItemTransactions(
  itemId: string,
  opts: { createdAtFrom?: string } = {}
): Promise<{ synced: number }> {
  const userId = await resolveUserId(itemId);
  if (!userId) {
    throw new Error(`PluggyItem ${itemId} não encontrado — ignore ou registre primeiro.`);
  }

  const pluggyItem = await prisma.pluggyItem.findUnique({
    where: { itemId },
    select: { id: true },
  });
  if (!pluggyItem) throw new Error(`PluggyItem ${itemId} sumiu durante sync.`);

  const accounts = await listAccounts(itemId);
  let synced = 0;

  for (const account of accounts) {
    const txs = await listTransactions(account.id, { createdAtFrom: opts.createdAtFrom });
    for (const tx of txs) {
      const mapped = mapPluggyTransaction(tx, account);
      const tagConnect = mapped.category
        ? { connect: [{ id: await resolveCategoryTagId(userId, mapped.category) }] }
        : undefined;

      await prisma.transaction.upsert({
        where: { externalId: tx.id },
        create: {
          userId,
          type: mapped.type,
          description: mapped.description,
          amount: mapped.amount,
          date: mapped.date,
          source: "pluggy",
          externalId: tx.id,
          pluggyItemId: pluggyItem.id,
          tags: tagConnect,
        },
        update: {
          type: mapped.type,
          description: mapped.description,
          amount: mapped.amount,
          date: mapped.date,
        },
      });
      synced++;
    }
  }

  await prisma.pluggyItem.update({
    where: { itemId },
    data: { lastSyncedAt: new Date() },
  });

  return { synced };
}

/** Remove transactions importadas quando o Pluggy avisa que foram deletadas. */
export async function deleteTransactionsByExternalIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.transaction.deleteMany({
    where: { externalId: { in: ids }, source: "pluggy" },
  });
}

/** Remove o Item e suas transactions importadas (item/deleted). */
export async function deletePluggyItem(itemId: string): Promise<void> {
  const item = await prisma.pluggyItem.findUnique({ where: { itemId }, select: { id: true } });
  if (!item) return;
  await prisma.transaction.deleteMany({
    where: { pluggyItemId: item.id, source: "pluggy" },
  });
  await prisma.pluggyItem.delete({ where: { itemId } });
}
