import "server-only";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_INBOUND_PER_WINDOW = 20;

export async function isRateLimited(conversationId: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await prisma.whatsappMessage.count({
    where: {
      conversationId,
      direction: "inbound",
      createdAt: { gte: since },
    },
  });
  return count >= MAX_INBOUND_PER_WINDOW;
}
