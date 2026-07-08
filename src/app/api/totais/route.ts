import { insightsClient } from "@/lib/insights-client";
import { createMonthInsightRoute } from "@/lib/month-insight-route";

export const GET = createMonthInsightRoute(insightsClient.getTotais);
