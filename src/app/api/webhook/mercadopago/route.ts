import "server-only";
import { WebhookSignatureValidator } from "mercadopago";
import { billingClient } from "@/lib/billing-client";

/** Tolerância do ts da assinatura: além disso é replay de webhook capturado. */
const SIGNATURE_TOLERANCE_MS = 5 * 60_000;

function verifySignature(request: Request, dataId: string, secret: string): boolean {
  const xSignature = request.headers.get("x-signature") ?? "";

  // Frescor: o ts é assinado, então um replay carrega o ts original. Feito
  // aqui (e não via toleranceSeconds do SDK) porque a doc do MP exemplifica ts
  // em segundos e o SDK assume ms — < 1e12 cobre segundos até ~2286.
  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const tsNum = Number(ts);
  if (!ts || !Number.isFinite(tsNum)) return false;
  const tsMs = tsNum < 1e12 ? tsNum * 1000 : tsNum;
  if (Math.abs(Date.now() - tsMs) > SIGNATURE_TOLERANCE_MS) return false;

  // Assinatura: delegada ao validador oficial do SDK, que monta o manifesto
  // documentado (`id:<lowercase>;request-id:...;ts:...;`) e compara o HMAC em
  // tempo constante.
  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret,
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let body: { type?: string; data?: { id?: string } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { type, data } = body as { type?: string; data?: { id?: string } };

  if (type !== "subscription_preapproval" || !data?.id) {
    return Response.json({ ok: true });
  }

  // Fail-closed: sem secret não há como verificar a origem — processar seria
  // aceitar webhook forjado ativando Pro de graça (mesmo padrão do CRON_SECRET).
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "MERCADO_PAGO_WEBHOOK_SECRET not configured" },
      { status: 500 }
    );
  }

  if (!verifySignature(request, data.id, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Verificada a origem, o processamento (mudança de plano — domínio) é do bfin-backend.
  await billingClient.processSubscriptionEvent(data.id);

  return Response.json({ ok: true });
}
