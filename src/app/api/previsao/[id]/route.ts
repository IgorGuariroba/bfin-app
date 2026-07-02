import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { previsaoService } from "@/adapters";
import { PrevisaoNotFoundError } from "@/core/previsao";
import type { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);
  const { id } = await params;

  try {
    const { name, amount } = await request.json();

    const updated = await previsaoService.updatePrevisao({ userId, id, name, amount });

    return Response.json(updated);
  } catch (error) {
    if (error instanceof PrevisaoNotFoundError) {
      return Response.json({ error: "Not found or unauthorized" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Erro";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);
  const { id } = await params;

  try {
    await previsaoService.deletePrevisao(userId, id);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof PrevisaoNotFoundError) {
      return Response.json({ error: "Not found or unauthorized" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Erro";
    return Response.json({ error: message }, { status: 400 });
  }
}
