import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoClient } from "@/lib/previsao-client";
import { backendErrorResponseOrRethrow } from "@/lib/backend-client";
import type { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = await getEffectiveUserId(session.user.id);
    const { id } = await params;

    const { name, amount } = await request.json();

    const updated = await previsaoClient.update(userId, id, { name, amount });

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

    const result = await previsaoClient.remove(userId, id);

    return Response.json(result);
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
}
