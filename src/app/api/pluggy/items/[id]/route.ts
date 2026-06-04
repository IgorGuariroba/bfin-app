import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import { deleteItem } from "@/lib/pluggy/client";
import { deletePluggyItem } from "@/lib/pluggy/sync";
import type { NextRequest } from "next/server";

/** Desconecta um banco: revoga no Pluggy e remove o Item + transactions importadas. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const { id } = await params;
  const item = await prisma.pluggyItem.findUnique({
    where: { id },
    select: { itemId: true, userId: true },
  });
  // Só quem gerencia o pool (conta efetiva) pode desconectar.
  if (!item || item.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteItem(item.itemId);
  } catch (err) {
    console.error("[pluggy] delete item on Pluggy failed:", err);
    // Segue removendo localmente — o webhook item/deleted é idempotente.
  }
  await deletePluggyItem(item.itemId);

  return new Response(null, { status: 204 });
}
