import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";
import { getUserPlan, isMonthAllowed } from "@/lib/plan";
import { createTransaction, TransactionValidationError } from "@/lib/transactions-service";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const plan = await getUserPlan(session.user.id);
  if (plan === "free" && month && !isMonthAllowed(month, plan)) {
    return Response.json(
      { error: "Histórico além de 3 meses disponível apenas no plano Pro", upgrade: true },
      { status: 403 }
    );
  }

  const where: Record<string, unknown> = { userId };

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    where.date = { gte: start, lt: end };
  } else if (from || to) {
    const parseLocalDay = (s: string, endOfDay = false) => {
      const [y, m, d] = s.split("-").map(Number);
      return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0);
    };
    where.date = {
      ...(from ? { gte: parseLocalDay(from) } : {}),
      ...(to ? { lte: parseLocalDay(to, true) } : {}),
    };
  }

  if (type) where.type = type;

  const tagId = searchParams.get("tagId");
  if (tagId) {
    where.tags = { some: { id: tagId } };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { tags: { select: { id: true, name: true, color: true } } },
    orderBy: { date: "asc" },
  });

  return Response.json(transactions);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const body = await request.json();
  const { type, description, amount, date, repeat, repeatEnd, repeatCount, tagIds } = body;

  try {
    const base = await createTransaction({
      userId,
      type,
      description,
      amount,
      date,
      repeat,
      repeatEnd,
      repeatCount,
      tagIds,
    });
    return Response.json(base, { status: 201 });
  } catch (error) {
    if (error instanceof TransactionValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
