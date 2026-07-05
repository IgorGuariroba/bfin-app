import "server-only";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { billingClient, BillingValidationError } from "@/lib/billing-client";

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  return Response.json(await billingClient.getPlanConfig());
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { monthlyAmount, annualAmount } = await request.json();

  try {
    const config = await billingClient.updatePlanConfig({ monthlyAmount, annualAmount });
    return Response.json(config);
  } catch (err) {
    if (err instanceof BillingValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
