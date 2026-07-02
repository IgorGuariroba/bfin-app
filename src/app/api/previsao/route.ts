import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoService } from "@/adapters";
import { PrevisaoValidationError } from "@/core/previsao";
import type { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const previsoes = await previsaoService.listPrevisoes(userId);

  return Response.json(previsoes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  try {
    const { name, amount } = await request.json();

    const previsao = await previsaoService.createPrevisao({ userId, name, amount });

    return Response.json(previsao, { status: 201 });
  } catch (error) {
    if (error instanceof PrevisaoValidationError) {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erro";
    return Response.json({ error: message }, { status: 400 });
  }
}
