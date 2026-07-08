import "server-only";
import { auth } from "@/lib/auth";
import { billingClient } from "@/lib/billing-client";
import { BackendError } from "@/lib/backend-client";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const origin =
    process.env.APP_URL?.replace(/\/$/, "") ??
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    request.nextUrl.origin;

  try {
    const { initPoint } = await billingClient.checkout({
      userId: session.user.id,
      email: session.user.email,
      cycle: body?.cycle,
      origin,
      // Atribuição de marketing (ADR-0010): cookies são adapter — o core decide
      // se/como gravar sem sobrescrever atribuição prévia.
      click: {
        gclid: request.cookies.get("bfin_gclid")?.value,
        gbraid: request.cookies.get("bfin_gbraid")?.value,
        wbraid: request.cookies.get("bfin_wbraid")?.value,
      },
    });
    return Response.json({ init_point: initPoint });
  } catch (err) {
    if (err instanceof BackendError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
