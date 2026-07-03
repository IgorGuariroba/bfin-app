import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappConversation } from "@/db/schema";
import { fromDbTimestamp } from "@/adapters/drizzle/timestamp";
import { requireAdminOr403 } from "@/lib/admin-route";

const ALLOWED = new Set(["bot", "waiting_human", "human", "closed"]);

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  const data = await request.json().catch(() => null);
  const status = typeof data?.status === "string" ? data.status : "";
  if (!ALLOWED.has(status)) return Response.json({ error: "Status inválido" }, { status: 400 });

  const [conversation] = await db
    .update(whatsappConversation)
    .set({ status })
    .where(eq(whatsappConversation.id, id))
    .returning();
  if (!conversation) throw new Error(`WhatsappConversation ${id} not found`);

  return Response.json({
    ...conversation,
    lastMessageAt: fromDbTimestamp(conversation.lastMessageAt),
    createdAt: fromDbTimestamp(conversation.createdAt),
  });
}
