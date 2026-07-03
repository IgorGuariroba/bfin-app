import { billingService } from "@/adapters";

export async function GET() {
  return Response.json(await billingService.getPlanPrices());
}
