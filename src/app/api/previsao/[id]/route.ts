import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const { name, amount } = data;

    // Check if it belongs to user
    const existing = await prisma.previsao.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return Response.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.previsao.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(amount !== undefined && { amount }),
      },
    });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if it belongs to user
    const existing = await prisma.previsao.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return Response.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.previsao.delete({
      where: { id: params.id },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
