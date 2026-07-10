import { billingClient } from "@/lib/billing-client";
import { backendErrorResponseOrRethrow } from "@/lib/backend-client";

export async function GET() {
  try {
    return Response.json(await billingClient.getPlanPrices());
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
}
