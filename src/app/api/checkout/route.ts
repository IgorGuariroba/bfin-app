import "server-only";
import { auth } from "@/lib/auth";
import { PreApproval } from "mercadopago";
import { mpClient, PLAN_PRICES, BillingCycle } from "@/lib/mercadopago";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const cycle = body?.cycle as BillingCycle | undefined;
  const price = cycle ? PLAN_PRICES[cycle] : undefined;
  if (!price) return Response.json({ error: "Ciclo inválido" }, { status: 400 });

  if (!session.user.email) {
    return Response.json({ error: "Conta sem e-mail" }, { status: 400 });
  }

  const origin = process.env.AUTH_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;

  const preApproval = new PreApproval(mpClient);
  const sub = await preApproval.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: {
      reason: `bfin Pro — ${price.label}`,
      payer_email: session.user.email,
      auto_recurring: {
        frequency: cycle === "annual" ? 12 : 1,
        frequency_type: "months",
        transaction_amount: price.amount,
        currency_id: "BRL",
      },
      back_url: `${origin}/assinar?success=true`,
      // notification_url is a valid MP API field not yet typed in SDK v2
      notification_url: `${origin}/api/webhook/mercadopago`,
      external_reference: `${session.user.id}:${cycle}`,
    } as any,
  });

  return Response.json({ init_point: sub.init_point });
}
