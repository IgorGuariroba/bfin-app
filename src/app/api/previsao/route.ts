import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import type { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const previsoes = await prisma.previsao.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return Response.json(previsoes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  try {
    const data = await request.json();
    const { name, amount } = data;

    if (!name || typeof amount !== "number") {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }

    const previsao = await prisma.previsao.create({
      data: {
        userId,
        name,
        amount,
      },
    });

    return Response.json(previsao, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
