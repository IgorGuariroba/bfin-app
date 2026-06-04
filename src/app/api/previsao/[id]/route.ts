import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
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
    const data = await request.json();
    const { name, amount } = data;

    const existing = await prisma.previsao.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.previsao.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(amount !== undefined && { amount }),
      },
    });

    return Response.json(updated);
  } catch (error) {
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
    const existing = await prisma.previsao.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return Response.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.previsao.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return Response.json({ error: message }, { status: 400 });
  }
}
