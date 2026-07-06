import "server-only";
import { requireAdminOr403 } from "@/lib/admin-route";
import { billingClient, BillingValidationError } from "@/lib/billing-client";

export async function GET() {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  return Response.json(await billingClient.getPlanConfig());
}

export async function POST(request: Request) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

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
