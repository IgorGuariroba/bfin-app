import "server-only";

import { prisma } from "@/lib/prisma";
import type { TransactionRepo } from "@/core/transactions";

const TAGS_INCLUDE = {
  tags: { select: { id: true, name: true, color: true } },
} as const;

export const prismaTransactionRepo: TransactionRepo = {
  list: ({ userId, type, tagId, date }, take) =>
    prisma.transaction.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(tagId ? { tags: { some: { id: tagId } } } : {}),
        ...(date ? { date } : {}),
      },
      include: TAGS_INCLUDE,
      orderBy: { date: "asc" },
      take,
    }),

  findDuplicate: (userId, type, amount, window) =>
    prisma.transaction.findFirst({
      where: { userId, type, amount, date: window },
      include: TAGS_INCLUDE,
      orderBy: { date: "asc" },
    }),

  countOwnedTags: (userId, tagIds) =>
    prisma.tag.count({ where: { userId, id: { in: tagIds } } }),

  create: (data, tagIds) =>
    prisma.transaction.create({
      data: {
        ...data,
        ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
      },
      include: TAGS_INCLUDE,
    }),

  createMany: async (data, tagIds) => {
    const created = await prisma.transaction.createManyAndReturn({
      data,
      select: { id: true },
    });
    if (tagIds?.length && created.length > 0) {
      const connect = tagIds.map((id) => ({ id }));
      await Promise.all(
        created.map((t) =>
          prisma.transaction.update({
            where: { id: t.id },
            data: { tags: { connect } },
          })
        )
      );
    }
  },

  findById: (id) => prisma.transaction.findUnique({ where: { id } }),

  update: (id, patch, tagIds) =>
    prisma.transaction.update({
      where: { id },
      data: {
        ...patch,
        // set substitui o conjunto de tags por completo (incl. desconectar todas).
        ...(tagIds !== undefined ? { tags: { set: tagIds.map((tid) => ({ id: tid })) } } : {}),
      },
      include: TAGS_INCLUDE,
    }),

  deleteOwned: async (userId, id) => {
    const { count } = await prisma.transaction.deleteMany({ where: { id, userId } });
    return count > 0;
  },
};
