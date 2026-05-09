import "server-only";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PreApproval } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, planExpiresAt: true, mpSubscriptionId: true },
  });

  return Response.json(user ?? { plan: "free", planExpiresAt: null, mpSubscriptionId: null });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mpSubscriptionId: true },
  });

  if (!user?.mpSubscriptionId) {
    return Response.json({ error: "Nenhuma assinatura ativa" }, { status: 400 });
  }

  const preApproval = new PreApproval(mpClient);
  await preApproval.update({
    id: user.mpSubscriptionId,
    body: { status: "cancelled" },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mpSubscriptionId: null },
  });

  return Response.json({ ok: true });
}
