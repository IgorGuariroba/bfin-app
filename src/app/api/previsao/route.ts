import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoClient } from "@/lib/previsao-client";
import { backendErrorResponseOrRethrow } from "@/lib/backend-client";
import type { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  try {
    const previsoes = await previsaoClient.list(userId);
    return Response.json(previsoes);
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  try {
    const { name, amount } = await request.json();

    const previsao = await previsaoClient.create({ userId, name, amount });

    return Response.json(previsao, { status: 201 });
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
}
