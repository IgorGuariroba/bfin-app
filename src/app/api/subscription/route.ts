import "server-only";
import { auth } from "@/lib/auth";
import { billingClient } from "@/lib/billing-client";
import { backendErrorResponse } from "@/lib/backend-client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return Response.json(await billingClient.getSubscription(session.user.id));
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await billingClient.cancelSubscription(session.user.id);
  } catch (err) {
    return backendErrorResponse(err);
  }

  return Response.json({ ok: true });
}
