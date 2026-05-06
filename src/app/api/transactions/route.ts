import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";
import { addDays, addWeeks, addMonths } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

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

  if (!type || !description || amount == null || !date) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validTypes = ["entrada", "saida", "diario", "cartao", "economia"];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return Response.json({ error: "amount must be positive number" }, { status: 400 });
  }

  const [dy, dm, dd] = (date as string).split("-").map(Number);
  const baseDate = new Date(dy, dm - 1, dd, 12, 0, 0);
  const repeatMode = repeat ?? "none";
  const endMode = repeatEnd ?? "forever";
  const count = repeatCount ?? 0;

  const connectTags = tagIds?.length
    ? { connect: (tagIds as string[]).map((id) => ({ id })) }
    : undefined;

  const base = await prisma.transaction.create({
    data: {
      userId,
      type,
      description,
      amount,
      date: baseDate,
      repeat: repeatMode,
      repeatEnd: endMode,
      repeatCount: count,
      tags: connectTags,
    },
    include: { tags: { select: { id: true, name: true, color: true } } },
  });

  if (repeatMode !== "none") {
    const extras = buildRepeatDates(baseDate, repeatMode, endMode, count);
    await prisma.transaction.createMany({
      data: extras.map((d) => ({
        userId,
        type,
        description,
        amount,
        date: d,
        repeat: repeatMode,
        repeatEnd: endMode,
        repeatCount: count,
      })),
    });
    if (connectTags && extras.length > 0) {
      const created = await prisma.transaction.findMany({
        where: { userId, date: { in: extras }, description, type },
        select: { id: true },
      });
      await Promise.all(
        created.map((t) =>
          prisma.transaction.update({
            where: { id: t.id },
            data: { tags: connectTags },
          })
        )
      );
    }
  }

  return Response.json(base, { status: 201 });
}

function buildRepeatDates(
  base: Date,
  repeat: string,
  repeatEnd: string,
  count: number
): Date[] {
  const dates: Date[] = [];
  const maxOccurrences = repeatEnd === "count" ? count - 1 : 12;
  const advance = repeat === "daily" ? addDays : repeat === "weekly" ? addWeeks : addMonths;

  for (let i = 1; i <= maxOccurrences; i++) {
    dates.push(advance(base, i));
  }
  return dates;
}
