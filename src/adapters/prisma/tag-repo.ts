import "server-only";

import { prisma } from "@/lib/prisma";
import type { TagRepo } from "@/core/tags";

export const prismaTagRepo: TagRepo = {
  findById: (id) => prisma.tag.findUnique({ where: { id } }),

  findByName: (userId, name) =>
    prisma.tag.findUnique({ where: { userId_name: { userId, name } } }),

  listByUser: (userId) =>
    prisma.tag.findMany({
      where: { userId },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),

  listSystemNames: async (userId) => {
    const rows = await prisma.tag.findMany({
      where: { userId, isSystem: true },
      select: { name: true },
    });
    return rows.map((t) => t.name);
  },

  create: (data) => prisma.tag.create({ data }),

  createSystemTags: async (userId, tags) => {
    await prisma.tag.createMany({
      data: tags.map((tag) => ({
        userId,
        name: tag.name,
        color: tag.color,
        isSystem: true,
      })),
      skipDuplicates: true,
    });
  },

  update: (id, patch) => prisma.tag.update({ where: { id }, data: patch }),

  delete: async (id) => {
    await prisma.tag.delete({ where: { id } });
  },
};
