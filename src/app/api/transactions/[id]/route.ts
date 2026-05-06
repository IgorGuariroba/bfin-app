import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, description, amount, date, repeat, repeatEnd, repeatCount, tagIds } = body;

  const validTypes = ["entrada", "saida", "diario", "cartao", "economia"];
  if (type && !validTypes.includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }
  if (amount != null && (typeof amount !== "number" || amount <= 0)) {
    return Response.json({ error: "amount must be positive number" }, { status: 400 });
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(type ? { type } : {}),
      ...(description ? { description } : {}),
      ...(amount != null ? { amount } : {}),
      ...(date ? { date: (() => { const [y,m,d] = (date as string).split("-").map(Number); return new Date(y, m-1, d, 12, 0, 0); })() } : {}),
      ...(repeat ? { repeat } : {}),
      ...(repeatEnd ? { repeatEnd } : {}),
      ...(repeatCount != null ? { repeatCount } : {}),
      ...(tagIds != null
        ? { tags: { set: (tagIds as string[]).map((tid) => ({ id: tid })) } }
        : {}),
    },
    include: { tags: { select: { id: true, name: true, color: true } } },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
