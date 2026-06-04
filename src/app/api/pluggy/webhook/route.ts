import "server-only";
import { after } from "next/server";
import {
  ensurePluggyItem,
  syncItemTransactions,
  deleteTransactionsByExternalIds,
  deletePluggyItem,
} from "@/lib/pluggy/sync";

type PluggyWebhookBody = {
  event?: string;
  itemId?: string;
  clientUserId?: string;
  transactionIds?: string[];
  transactionsCreatedAtFrom?: string;
};

/**
 * Pluggy exige resposta 2xx em < 5s, senão reenvia (até 9x).
 * Respondemos imediatamente e processamos via `after()` (waitUntil no Vercel).
 * Idempotência garantida por externalId @unique no upsert — retries são inofensivos.
 */
export async function POST(request: Request) {
  let body: PluggyWebhookBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, itemId, clientUserId, transactionIds, transactionsCreatedAtFrom } = body;
  if (!event) return Response.json({ ok: true });

  // clientUserId vem como "ownerId:actorId" (ver connect-token).
  // ownerId = dono do pool; actorId = quem conectou. Fallback: sem ":", ambos iguais.
  const [ownerId, actorId] = (clientUserId ?? "").split(":");
  const connectedByUserId = actorId || ownerId;

  after(async () => {
    try {
      switch (event) {
        case "item/created":
        case "item/updated":
          if (itemId && ownerId) {
            await ensurePluggyItem(itemId, ownerId, connectedByUserId);
            if (event === "item/created") await syncItemTransactions(itemId);
          }
          break;

        case "item/deleted":
          if (itemId) await deletePluggyItem(itemId);
          break;

        case "transactions/created":
        case "transactions/updated":
          if (itemId) {
            // Garante o Item registrado (caso o transactions chegue antes do item/created).
            if (ownerId) await ensurePluggyItem(itemId, ownerId, connectedByUserId);
            await syncItemTransactions(itemId, { createdAtFrom: transactionsCreatedAtFrom });
          }
          break;

        case "transactions/deleted":
          if (transactionIds?.length) await deleteTransactionsByExternalIds(transactionIds);
          break;
      }
    } catch (err) {
      console.error(`[pluggy] webhook ${event} processing failed:`, err);
    }
  });

  return Response.json({ ok: true });
}
