import "server-only";
import { auth } from "@/lib/auth";
import { billingService } from "@/adapters";
import { BillingValidationError } from "@/core/billing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json(await billingService.getSubscription(session.user.id));
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await billingService.cancelSubscription(session.user.id);
  } catch (err) {
    if (err instanceof BillingValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  return Response.json({ ok: true });
}
