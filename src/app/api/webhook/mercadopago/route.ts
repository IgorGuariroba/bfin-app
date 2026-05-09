import "server-only";
import { PreApproval } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body as { type?: string; data?: { id?: string } };

  if (type !== "subscription_preapproval" || !data?.id) {
    return Response.json({ ok: true });
  }

  const preApproval = new PreApproval(mpClient);
  const sub = await preApproval.get({ id: data.id });

  const [userId, cycle] = (sub.external_reference ?? "").split(":");
  if (!userId) return Response.json({ ok: true });

  if (sub.status === "authorized") {
    const billingDays = cycle === "annual" ? 365 : 30;
    const planExpiresAt = new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "pro", planExpiresAt, mpSubscriptionId: sub.id },
    });
  } else if (sub.status === "cancelled" || sub.status === "paused") {
    await prisma.user.update({
      where: { id: userId },
      data: { mpSubscriptionId: null },
    });
  }

  return Response.json({ ok: true });
}
