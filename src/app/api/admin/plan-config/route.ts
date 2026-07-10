import "server-only";
import { requireAdminOr403 } from "@/lib/admin-route";
import { billingClient } from "@/lib/billing-client";
import { backendErrorResponse } from "@/lib/backend-client";

export async function GET() {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  try {
    return Response.json(await billingClient.getPlanConfig());
  } catch (err) {
    return backendErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { monthlyAmount, annualAmount } = await request.json();

  try {
    const config = await billingClient.updatePlanConfig({ monthlyAmount, annualAmount });
    return Response.json(config);
  } catch (err) {
    return backendErrorResponse(err);
  }
}
