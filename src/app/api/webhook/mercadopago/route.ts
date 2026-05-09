import "server-only";
import { createHmac } from "crypto";
import { PreApproval } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

function verifySignature(request: Request, rawBody: string, dataId: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // skip validation when secret not configured

  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";

  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;

  const message = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  const expected = createHmac("sha256", secret).update(message).digest("hex");

  return expected === v1;
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

  if (!verifySignature(request, rawBody, data.id)) {
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
