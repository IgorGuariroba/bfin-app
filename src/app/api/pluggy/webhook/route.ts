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
 * O endpoint é público e dispara operações sensíveis (linkar/sincronizar/apagar
 * dados bancários). A Pluggy envia webhooks a partir de IP fixo (177.71.238.212).
 * Validamos a origem para mitigar spoofing/IDOR.
 *
 * Atrás do Caddy (reverse proxy de hop único) o IP real do cliente é o ÚLTIMO da
 * cadeia x-forwarded-for — o Caddy faz append do remote address. Pegar o primeiro
 * seria spoofável (atacante envia seu próprio XFF). Configurável via env para não
 * travar dev/túnel: PLUGGY_WEBHOOK_ALLOWED_IPS="*" desliga a checagem.
 */
function isAllowedOrigin(request: Request): boolean {
  const raw = (process.env.PLUGGY_WEBHOOK_ALLOWED_IPS ?? "177.71.238.212").trim();
  if (raw === "*") return true;
  const allowed = new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));

  const parts = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const clientIp = parts.length ? parts[parts.length - 1] : request.headers.get("x-real-ip");

  return !!clientIp && allowed.has(clientIp);
}

/**
 * Pluggy exige resposta 2xx em < 5s, senão reenvia (até 9x).
 * Respondemos imediatamente e processamos via `after()` (waitUntil no Vercel).
 * Idempotência garantida por externalId @unique no upsert — retries são inofensivos.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !isAllowedOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

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
          // O evento transactions/* não traz clientUserId, então não dá para
          // registrar o Item aqui. O item/created sempre chega antes e já dispara
          // a primeira sync — quando transactions/* chega, o Item já existe.
          if (itemId) {
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
