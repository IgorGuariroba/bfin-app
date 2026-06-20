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

  // Delete existing diario transactions in the 12-month window.
  // Apenas lançamentos manuais — nunca toca em importados via Open Finance (source: pluggy).
  await prisma.transaction.deleteMany({
    where: {
      userId,
      type: "diario",
      source: "manual",
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
      // Meio-dia em hora local do servidor (igual a parseTransactionDay). Em prod
      // o container roda UTC → 12:00Z, o que dá ~12h de folga das bordas da janela
      // da baixa automática (saoPauloTodayRange/ADR-0005 §7). A invariante "diário
      // ao meio-dia UTC" da baixa depende desse deploy em UTC.
      date: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 12, 0, 0),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  await prisma.transaction.createMany({ data: toCreate });

  return Response.json({ count: toCreate.length });
}
