import "server-only";

import { prisma } from "@/lib/prisma";
import type { ApiKeyRepo } from "@/core/apikeys";

export const prismaApiKeyRepo: ApiKeyRepo = {
  listByUser: (userId) =>
    prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
    }),

  revokeAllActive: async (userId, at) => {
    await prisma.apiKey.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: at },
    });
  },

  create: (data) =>
    prisma.apiKey.create({
      data,
      select: { id: true, prefix: true, name: true, createdAt: true },
    }),

  findOwned: (userId, id) =>
    prisma.apiKey.findFirst({
      where: { id, userId },
      select: { id: true, revokedAt: true },
    }),

  revoke: async (id, at) => {
    await prisma.apiKey.update({ where: { id }, data: { revokedAt: at } });
  },

  findByHashedKey: (hashedKey) =>
    prisma.apiKey.findUnique({
      where: { hashedKey },
      select: { id: true, userId: true, revokedAt: true },
    }),

  bumpLastUsed: async (id, at) => {
    await prisma.apiKey.update({ where: { id }, data: { lastUsedAt: at } });
  },
};
