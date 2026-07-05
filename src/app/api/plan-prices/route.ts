import { billingClient } from "@/lib/billing-client";

export async function GET() {
  return Response.json(await billingClient.getPlanPrices());
}
