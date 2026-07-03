import "server-only";

import { prisma } from "@/lib/prisma";
import type { BillingRepo } from "@/core/billing";

const DEFAULT_CONFIG = { id: "default", monthlyAmount: 14.9, annualAmount: 119.9 };

export const prismaBillingRepo: BillingRepo = {
  getPlanConfig: () =>
    prisma.planConfig.upsert({
      where: { id: "default" },
      update: {},
      create: DEFAULT_CONFIG,
    }),

  updatePlanConfig: (monthlyAmount, annualAmount) =>
    prisma.planConfig.upsert({
      where: { id: "default" },
      update: { monthlyAmount, annualAmount },
      create: { id: "default", monthlyAmount, annualAmount },
    }),

  findSubscription: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true, mpSubscriptionId: true },
    }),

  clearSubscription: async (userId) => {
    await prisma.user.update({
      where: { id: userId },
      data: { mpSubscriptionId: null },
    });
  },

  activatePro: (userId, planExpiresAt, mpSubscriptionId) =>
    prisma.user.update({
      where: { id: userId },
      data: { plan: "pro", planExpiresAt, mpSubscriptionId },
      select: { email: true, gclid: true, gbraid: true, wbraid: true },
    }),

  captureClickAttribution: async (userId, click) => {
    // updateMany com as 3 colunas null — não sobrescreve atribuição prévia.
    await prisma.user.updateMany({
      where: { id: userId, gclid: null, gbraid: null, wbraid: null },
      data: click,
    });
  },

  conversionAlreadyReported: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { conversionReportedAt: true },
    });
    return user?.conversionReportedAt != null;
  },

  markConversionReported: async (userId) => {
    await prisma.user.update({
      where: { id: userId },
      data: { conversionReportedAt: new Date() },
    });
  },
};
