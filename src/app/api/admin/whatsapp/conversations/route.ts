import "server-only";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOr403 } from "@/lib/admin-route";

const VALID_STATUS = new Set(["bot", "waiting_human", "human", "closed", "rate_limited"]);

export async function GET(request: NextRequest) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const status = request.nextUrl.searchParams.get("status");
  const where = status && VALID_STATUS.has(status) ? { status } : {};

  const conversations = await prisma.whatsappConversation.findMany({
    where,
    orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }],
    take: 200,
    include: {
      contact: { select: { id: true, phone: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, direction: true, createdAt: true } },
    },
  });

  return Response.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      status: c.status,
      lastMessageAt: c.lastMessageAt,
      contact: c.contact,
      lastMessage: c.messages[0] ?? null,
    })),
  });
}
