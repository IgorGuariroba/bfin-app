import "server-only";

import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths } from "@/lib/date-utils";

type Transaction = Awaited<ReturnType<typeof prisma.transaction.create>>;

export class TransactionValidationError extends Error {}

const VALID_TYPES = ["entrada", "saida", "diario", "cartao", "economia"];

export interface CreateTransactionInput {
  userId: string;
  type: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  source?: "manual" | "agent";
  repeat?: string;
  repeatEnd?: string;
  repeatCount?: number;
  tagIds?: string[];
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const { userId, type, description, amount, source = "manual" } = input;

  if (!type || !description || amount == null || !input.date) {
    throw new TransactionValidationError("Missing required fields");
  }
  if (!VALID_TYPES.includes(type)) {
    throw new TransactionValidationError("Invalid type");
  }
  if (typeof amount !== "number" || amount <= 0) {
    throw new TransactionValidationError("amount must be positive number");
  }

  const [dy, dm, dd] = input.date.split("-").map(Number);
  const baseDate = new Date(dy, dm - 1, dd, 12, 0, 0);
  if (isNaN(baseDate.getTime())) {
    throw new TransactionValidationError("Invalid date format");
  }
  const repeat = input.repeat ?? "none";
  const repeatEnd = input.repeatEnd ?? "forever";
  const repeatCount = input.repeatCount ?? 0;

  const connectTags = input.tagIds?.length
    ? { connect: input.tagIds.map((id) => ({ id })) }
    : undefined;

  const base = await prisma.transaction.create({
    data: {
      userId,
      type,
      description,
      amount,
      date: baseDate,
      source,
      repeat,
      repeatEnd,
      repeatCount,
      tags: connectTags,
    },
    include: { tags: { select: { id: true, name: true, color: true } } },
  });

  if (repeat !== "none") {
    const extras = buildRepeatDates(baseDate, repeat, repeatEnd, repeatCount);
    const createdExtras = await prisma.transaction.createManyAndReturn({
      data: extras.map((d) => ({
        userId,
        type,
        description,
        amount,
        date: d,
        source,
        repeat,
        repeatEnd,
        repeatCount,
      })),
      select: { id: true },
    });
    if (connectTags && createdExtras.length > 0) {
      await Promise.all(
        createdExtras.map((t) =>
          prisma.transaction.update({
            where: { id: t.id },
            data: { tags: connectTags },
          })
        )
      );
    }
  }

  return base;
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
