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
  const { amount, monthStr } = body;

  if (amount == null || !monthStr) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const [year, mon] = monthStr.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const startOfMonth = new Date(year, mon - 1, 1);
  const endOfMonth = new Date(year, mon, 1);

  // Find days that already have a "diario" transaction
  const existing = await prisma.transaction.findMany({
    where: {
      userId,
      type: "diario",
      date: { gte: startOfMonth, lt: endOfMonth },
    },
    select: { date: true },
  });

  const existingDays = new Set(existing.map((t) => t.date.getDate()));

  const now = new Date();
  let startDay = 1;
  if (now.getFullYear() === year && now.getMonth() + 1 === mon) {
    startDay = now.getDate();
  }

  const toCreate = [];
  for (let d = startDay; d <= daysInMonth; d++) {
    if (!existingDays.has(d)) {
      toCreate.push({
        userId,
        type: "diario",
        description: "Previsão Diária",
        amount: Math.abs(amount),
        date: new Date(year, mon - 1, d, 12, 0, 0), // noon to avoid timezone shift
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.transaction.createMany({ data: toCreate });
  }

  return Response.json({ count: toCreate.length });
}
