import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoClient } from "@/lib/previsao-client";
import { backendErrorResponse } from "@/lib/backend-client";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getEffectiveUserId(session.user.id);
  const { amount } = await request.json();

  try {
    const { count } = await previsaoClient.aplicar(userId, amount);

    return Response.json({ count });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
