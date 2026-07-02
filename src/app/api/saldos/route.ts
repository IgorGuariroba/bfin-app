import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { getUserPlan, isFutureMonthAllowed } from "@/lib/plan";
import { insightsService } from "@/adapters";
import { InsightsValidationError } from "@/core/insights";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  if (!month) return Response.json({ error: "month required" }, { status: 400 });

  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon || mon < 1 || mon > 12) {
    return Response.json({ error: "invalid month" }, { status: 400 });
  }

  const plan = await getUserPlan(userId);
  if (!isFutureMonthAllowed(month, plan)) {
    return Response.json({ error: "plan_required" }, { status: 403 });
  }

  try {
    return Response.json(await insightsService.getSaldos(userId, month));
  } catch (error) {
    if (error instanceof InsightsValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
