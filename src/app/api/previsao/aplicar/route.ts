import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoService } from "@/adapters";
import { PrevisaoValidationError } from "@/core/previsao";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getEffectiveUserId(session.user.id);
  const { amount } = await request.json();

  try {
    const { count } = await previsaoService.applyPrevisao({ userId, amount });

    return Response.json({ count });
  } catch (error) {
    if (error instanceof PrevisaoValidationError) {
      return Response.json({ error: "Invalid parameters" }, { status: 400 });
    }
    throw error;
  }
}
