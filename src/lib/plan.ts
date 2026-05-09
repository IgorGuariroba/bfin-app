import "server-only";
import { prisma } from "@/lib/prisma";
export {
  FREE_HISTORY_MONTHS,
  FREE_FUTURE_MONTHS,
  type Plan,
  freeOldestMonth,
  freeNewestMonth,
  currentYearMonth,
  isMonthAllowed,
  isFutureMonthAllowed,
} from "@/lib/plan-utils";
import type { Plan } from "@/lib/plan-utils";

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!user || user.plan !== "pro") return "free";
  if (user.planExpiresAt && user.planExpiresAt < new Date()) {
    await prisma.user.update({ where: { id: userId }, data: { plan: "free" } });
    return "free";
  }
  return "pro";
}
