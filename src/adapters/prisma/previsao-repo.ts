import "server-only";

import { prisma } from "@/lib/prisma";
import type { PrevisaoRepo } from "@/core/previsao";

export const prismaPrevisaoRepo: PrevisaoRepo = {
  listByUser: (userId) =>
    prisma.previsao.findMany({ where: { userId }, orderBy: { name: "asc" } }),

  create: (data) => prisma.previsao.create({ data }),

  findById: (id) => prisma.previsao.findUnique({ where: { id } }),

  update: (id, patch) => prisma.previsao.update({ where: { id }, data: patch }),

  delete: async (id) => {
    await prisma.previsao.delete({ where: { id } });
  },

  deleteManualDiario: async (userId, { gte, lt }) => {
    await prisma.transaction.deleteMany({
      where: {
        userId,
        type: "diario",
        source: "manual",
        date: { gte, lt },
      },
    });
  },

  createDiarios: async (rows) => {
    // source fica no default do schema ("manual"), como antes da extração.
    await prisma.transaction.createMany({
      data: rows.map((row) => ({ ...row, type: "diario" })),
    });
  },

  deleteManualDiarioForAutoBaixa: async ({ gte, lt }, now) => {
    // Único deleteMany, filtrado pela relação (ADR-0005). planExpiresAt replica
    // getUserPlan (plan.ts): pro vencido conta como free.
    const { count } = await prisma.transaction.deleteMany({
      where: {
        type: "diario",
        source: "manual",
        date: { gte, lt },
        user: {
          autoBaixaDiario: true,
          plan: "pro",
          OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }],
        },
      },
    });
    return count;
  },
};
