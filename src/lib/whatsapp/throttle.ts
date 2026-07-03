import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappMessage } from "@/db/schema";
import { toDbTimestamp } from "@/adapters/drizzle/timestamp";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_INBOUND_PER_WINDOW = 20;

export async function isRateLimited(conversationId: string): Promise<boolean> {
  const since = toDbTimestamp(new Date(Date.now() - WINDOW_MS));
  const [row] = await db
    .select({ n: count() })
    .from(whatsappMessage)
    .where(
      and(
        eq(whatsappMessage.conversationId, conversationId),
        eq(whatsappMessage.direction, "inbound"),
        gte(whatsappMessage.createdAt, since)
      )
    );
  return row.n >= MAX_INBOUND_PER_WINDOW;
}
