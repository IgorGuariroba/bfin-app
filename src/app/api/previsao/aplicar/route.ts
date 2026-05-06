import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getEffectiveUserId(session.user.id);
  const body = await request.json();
  const { amount } = body;

  if (amount == null) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate(), 0, 0, 0);

  // Delete existing diario transactions in the 12-month window
  await prisma.transaction.deleteMany({
    where: {
      userId,
      type: "diario",
      date: { gte: startDate, lt: endDate },
    },
  });

  const toCreate = [];
  const cursor = new Date(startDate);
  while (cursor < endDate) {
    toCreate.push({
      userId,
      type: "diario",
      description: "Previsão Diária",
      amount: Math.abs(amount),
      date: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 12, 0, 0),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  await prisma.transaction.createMany({ data: toCreate });

  return Response.json({ count: toCreate.length });
}
