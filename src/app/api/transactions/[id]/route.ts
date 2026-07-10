import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";
import { transactionsClient } from "@/lib/transactions-client";
import { backendErrorResponseOrRethrow } from "@/lib/backend-client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = await getEffectiveUserId(session.user.id);

    const { id } = await params;
    const body = await request.json();
    const { type, description, amount, date, tagIds } = body;

    const updated = await transactionsClient.update(userId, id, {
      type,
      description,
      amount,
      date,
      tagIds,
    });
    return Response.json(updated);
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = await getEffectiveUserId(session.user.id);

    const { id } = await params;
    await transactionsClient.remove(userId, id);
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
  return new Response(null, { status: 204 });
}
