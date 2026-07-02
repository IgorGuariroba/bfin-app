import "server-only";

import { prisma } from "@/lib/prisma";
import type { MembersRepo } from "@/core/identity";

const memberSelect = { select: { name: true, email: true, image: true } };
const ownerSelect = { select: { id: true, name: true, email: true, image: true } };

export const prismaMembersRepo: MembersRepo = {
  listSent: (ownerId) =>
    prisma.accountMember.findMany({
      where: { ownerId },
      include: { member: memberSelect },
      orderBy: { createdAt: "desc" },
    }),

  listReceivedActive: (memberId) =>
    prisma.accountMember.findMany({
      where: { memberId, status: "active" },
      include: { owner: ownerSelect },
      orderBy: { createdAt: "desc" },
    }),

  hasPendingOrActiveInvite: async (ownerId, inviteEmail) => {
    const existing = await prisma.accountMember.findFirst({
      where: { ownerId, inviteEmail, status: { in: ["pending", "active"] } },
      select: { id: true },
    });
    return existing !== null;
  },

  createInvite: (data) => prisma.accountMember.create({ data }),

  findByToken: (token) =>
    prisma.accountMember.findUnique({
      where: { inviteToken: token },
      include: { owner: { select: { name: true, email: true } } },
    }),

  activate: (id, memberId) =>
    prisma.accountMember.update({ where: { id }, data: { memberId, status: "active" } }),

  findById: (id) => prisma.accountMember.findUnique({ where: { id } }),

  delete: async (id) => {
    await prisma.accountMember.delete({ where: { id } });
  },
};
