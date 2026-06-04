import "server-only";
import { auth } from "@/lib/auth";
import { PreApproval } from "mercadopago";
import type { PreApprovalRequest } from "mercadopago/dist/clients/preApproval/commonTypes";
import { mpClient, PLAN_PRICES, BillingCycle } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const cycle = body?.cycle as BillingCycle | undefined;
  if (!cycle || !PLAN_PRICES[cycle]) return Response.json({ error: "Ciclo inválido" }, { status: 400 });

  const planConfig = await prisma.planConfig.findUnique({ where: { id: "default" } });
  const price = {
    amount: cycle === "annual"
      ? (planConfig?.annualAmount ?? PLAN_PRICES.annual.amount)
      : (planConfig?.monthlyAmount ?? PLAN_PRICES.monthly.amount),
    label: PLAN_PRICES[cycle].label,
  };

  if (!session.user.email) {
    return Response.json({ error: "Conta sem e-mail" }, { status: 400 });
  }

  const origin = process.env.APP_URL?.replace(/\/$/, "") ?? process.env.AUTH_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;

  try {
    const preApproval = new PreApproval(mpClient);
    const sub = await preApproval.create({
      body: {
        reason: `bfin Pro — ${price.label}`,
        payer_email: session.user.email,
        auto_recurring: {
          frequency: cycle === "annual" ? 12 : 1,
          frequency_type: "months",
          transaction_amount: price.amount,
          currency_id: "BRL",
        },
        back_url: `${origin}/assinar`,
        notification_url: `${origin}/api/webhook/mercadopago`,
        external_reference: `${session.user.id}:${cycle}`,
        // O tipo do SDK do Mercado Pago não cobre notification_url no body do
        // PreApproval, embora a API aceite. Cast localizado em vez de any solto.
      } as PreApprovalRequest,
    });
    return Response.json({ init_point: sub.init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro MP";
    console.error("[checkout] error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
