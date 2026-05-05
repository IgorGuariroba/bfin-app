import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  if (!month) return Response.json({ error: "month required" }, { status: 400 });

  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon || mon < 1 || mon > 12) {
    return Response.json({ error: "invalid month" }, { status: 400 });
  }

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const [prevAgg, transactions] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId: session.user.id, date: { lt: start } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, date: { gte: start, lt: end } },
      select: { type: true, amount: true, date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const prevByType: Record<string, number> = {};
  for (const g of prevAgg) {
    prevByType[g.type] = g._sum.amount ?? 0;
  }

  const daysCount = new Date(year, mon, 0).getDate();
  const byDay: Record<number, Record<string, number>> = {};
  for (let d = 1; d <= daysCount; d++) byDay[d] = {};

  for (const t of transactions) {
    const day = t.date.getDate();
    byDay[day][t.type] = (byDay[day][t.type] ?? 0) + t.amount;
  }

  let accSaldo =
    (prevByType.entrada ?? 0) -
    (prevByType.saida ?? 0) -
    (prevByType.diario ?? 0) -
    (prevByType.cartao ?? 0);
  const entries = [];

  for (let d = 1; d <= daysCount; d++) {
    const bt = byDay[d];
    accSaldo +=
      (bt.entrada ?? 0) - (bt.saida ?? 0) - (bt.diario ?? 0) - (bt.cartao ?? 0);

    entries.push({
      day: d,
      date: `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      byType: bt,
      accSaldo,
    });
  }

  return Response.json(entries);
}
