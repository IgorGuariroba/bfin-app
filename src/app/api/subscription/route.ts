import "server-only";
import { auth } from "@/lib/auth";
import { billingClient } from "@/lib/billing-client";
import { BackendError } from "@/lib/backend-client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json(await billingClient.getSubscription(session.user.id));
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await billingClient.cancelSubscription(session.user.id);
  } catch (err) {
    if (err instanceof BackendError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  return Response.json({ ok: true });
}
