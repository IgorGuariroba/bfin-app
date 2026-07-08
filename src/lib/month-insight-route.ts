import "server-only";
import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { getUserPlan, isFutureMonthAllowed } from "@/lib/plan";
import { BackendError } from "@/lib/backend-client";
import type { NextRequest } from "next/server";

export function createMonthInsightRoute<T>(fetchInsight: (userId: string, month: string) => Promise<T>) {
  return async function GET(request: NextRequest) {
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
      return Response.json(await fetchInsight(userId, month));
    } catch (error) {
      if (error instanceof BackendError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
  };
}
