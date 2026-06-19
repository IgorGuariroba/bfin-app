import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";
import { getUserPlan, isMonthAllowed } from "@/lib/plan";
import {
  createTransaction,
  listTransactions,
  TransactionValidationError,
} from "@/lib/transactions-service";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM

  const plan = await getUserPlan(session.user.id);
  if (plan === "free" && month && !isMonthAllowed(month, plan)) {
    return Response.json(
      { error: "Histórico além de 3 meses disponível apenas no plano Pro", upgrade: true },
      { status: 403 }
    );
  }

  const transactions = await listTransactions(userId, {
    month: month ?? undefined,
    type: searchParams.get("type") ?? undefined,
    tagId: searchParams.get("tagId") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
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
    const result = await createTransaction({
      userId,
      type,
      description,
      amount,
      date,
      repeat,
      repeatEnd,
      repeatCount,
      tagIds,
      force: true, // UI: sempre cria (dedup defensivo é feature do agente — ADR-0004)
    });
    return Response.json(result.transaction, { status: 201 });
  } catch (error) {
    if (error instanceof TransactionValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
