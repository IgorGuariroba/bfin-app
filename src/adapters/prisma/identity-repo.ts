import "server-only";

import { prisma } from "@/lib/prisma";
import type { IdentityRepo } from "@/core/identity";

export const prismaIdentityRepo: IdentityRepo = {
  findPlanInfo: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    }),

  setPlanFree: async (userId) => {
    await prisma.user.update({ where: { id: userId }, data: { plan: "free" } });
  },

  setAutoBaixaDiario: async (userId, enabled) => {
    await prisma.user.update({ where: { id: userId }, data: { autoBaixaDiario: enabled } });
  },

  findActiveMembershipOwner: async (ownerId, memberId) => {
    const member = await prisma.accountMember.findFirst({
      where: { ownerId, memberId, status: "active" },
      include: { owner: { select: { name: true, email: true } } },
    });
    return member ? { name: member.owner.name, email: member.owner.email } : null;
  },
};
