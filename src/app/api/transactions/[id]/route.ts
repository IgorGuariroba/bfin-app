import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";
import { transactionsService } from "@/adapters";
import { TransactionNotFoundError, TransactionValidationError } from "@/core/transactions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { id } = await params;
  const body = await request.json();
  const { type, description, amount, date, tagIds } = body;

  try {
    const updated = await transactionsService.updateTransaction({
      userId,
      id,
      type,
      description,
      amount,
      date,
      tagIds,
    });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (error instanceof TransactionValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { id } = await params;
  try {
    await transactionsService.deleteTransaction(userId, id);
  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
  return new Response(null, { status: 204 });
}
