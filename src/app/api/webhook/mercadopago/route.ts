import "server-only";
import { PreApproval, WebhookSignatureValidator } from "mercadopago";
import { mpClient, PLAN_PRICES } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import {
  isGoogleAdsConfigured,
  resolveClickId,
  uploadConversion,
  type ClickId,
} from "@/lib/google-ads";

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

/**
 * Reporta a conversão de assinatura ao Google Ads (ADR-0010), uma única vez.
 * Falhas nunca quebram o webhook — ele precisa responder 200 ao MercadoPago.
 * Dedup: o campo `conversionReportedAt` descarta renovações (que também chegam
 * como `authorized`) e reenvios do mesmo evento.
 */
async function maybeReportConversion(
  userId: string,
  clickId: ClickId | null,
  cycle: string | undefined,
  txAmount: number | undefined,
) {
  if (!clickId || !isGoogleAdsConfigured()) return;

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { conversionReportedAt: true },
  });
  if (current?.conversionReportedAt) return;

  const fallback =
    cycle === "annual" || cycle === "monthly"
      ? PLAN_PRICES[cycle].amount
      : PLAN_PRICES.monthly.amount;
  const value = txAmount ?? fallback;

  const result = await uploadConversion({
    clickId,
    value,
    occurredAt: new Date(),
  });
  if (result.ok) {
    await prisma.user.update({
      where: { id: userId },
      data: { conversionReportedAt: new Date() },
    });
  } else if (result.reason === "error") {
    console.error("[google-ads] conversion upload failed:", result.error);
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

  const preApproval = new PreApproval(mpClient);
  const sub = await preApproval.get({ id: data.id });

  const [userId, cycle] = (sub.external_reference ?? "").split(":");
  if (!userId) return Response.json({ ok: true });

  if (sub.status === "authorized") {
    const billingDays = cycle === "annual" ? 365 : 30;
    const planExpiresAt = new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan: "pro", planExpiresAt, mpSubscriptionId: sub.id },
    });

    // Conversão de marketing (ADR-0010): só na 1ª ativação, se houver
    // identificador de clique e o Google Ads estiver configurado. Renovações
    // (também "authorized") são descartadas por conversionReportedAt.
    const txAmount =
      (sub as { auto_recurring?: { transaction_amount?: number } }).auto_recurring
        ?.transaction_amount;
    await maybeReportConversion(userId, resolveClickId(user), cycle, txAmount);

    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
      const label = cycle === "annual" ? "Anual (R$ 119,90)" : "Mensal (R$ 14,90)";
      fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "Nova assinatura bfin Pro",
            color: 0x22c55e,
            fields: [
              { name: "Usuário", value: user.email ?? userId, inline: true },
              { name: "Plano", value: label, inline: true },
              { name: "Expira em", value: planExpiresAt.toLocaleDateString("pt-BR"), inline: true },
              { name: "Subscription ID", value: sub.id ?? "-", inline: false },
            ],
            timestamp: new Date().toISOString(),
          }],
        }),
      }).catch((e) => console.error("[discord] notify failed:", e));
    }
  } else if (sub.status === "cancelled" || sub.status === "paused") {
    await prisma.user.update({
      where: { id: userId },
      data: { mpSubscriptionId: null },
    });
  }

  return Response.json({ ok: true });
}
