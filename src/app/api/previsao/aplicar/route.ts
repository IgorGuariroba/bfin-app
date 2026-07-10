import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoClient } from "@/lib/previsao-client";
import { backendErrorResponseOrRethrow } from "@/lib/backend-client";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = await getEffectiveUserId(session.user.id);
    const { amount } = await request.json();

    const { count } = await previsaoClient.aplicar(userId, amount);

    return Response.json({ count });
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
}
