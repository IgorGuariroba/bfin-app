import "server-only";

import { prisma } from "@/lib/prisma";
import type { InsightsRepo } from "@/core/insights";

export const prismaInsightsRepo: InsightsRepo = {
  sumByType: async (userId, range) => {
    const groups = await prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: range },
      _sum: { amount: true },
    });
    const byType: Record<string, number> = {};
    for (const g of groups) byType[g.type] = g._sum.amount ?? 0;
    return byType;
  },

  listMovements: (userId, range) =>
    prisma.transaction.findMany({
      where: { userId, date: range },
      select: { type: true, amount: true, date: true },
      orderBy: { date: "asc" },
    }),

  sumPrevisoes: async (userId) => {
    const agg = await prisma.previsao.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? 0;
  },
};
