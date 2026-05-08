import "server-only";
import { prisma } from "@/lib/prisma";

export const FREE_HISTORY_MONTHS = 3;

export type Plan = "free" | "pro";

export async function getUserPlan(userId: string): Promise<Plan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return (user?.plan ?? "free") as Plan;
}

/** Returns the oldest YYYY-MM month a free user can access (inclusive). */
export function freeOldestMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - (FREE_HISTORY_MONTHS - 1), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function isMonthAllowed(month: string, plan: Plan): boolean {
  if (plan === "pro") return true;
  return month >= freeOldestMonth();
}
