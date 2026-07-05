import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoClient } from "@/lib/previsao-client";
import { BackendError } from "@/lib/backend-client";
import type { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const previsoes = await previsaoClient.list(userId);

  return Response.json(previsoes);
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
    if (error instanceof BackendError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Erro";
    return Response.json({ error: message }, { status: 400 });
  }
}
