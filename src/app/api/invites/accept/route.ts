import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { token } = body;

  if (!token || typeof token !== "string") {
    return Response.json({ error: "Token inválido" }, { status: 400 });
  }

  const invite = await prisma.accountMember.findUnique({
    where: { inviteToken: token },
    include: { owner: { select: { name: true, email: true } } },
  });

  if (!invite) return Response.json({ error: "Convite não encontrado" }, { status: 404 });
  if (invite.status !== "pending") return Response.json({ error: "Convite já utilizado" }, { status: 400 });

  const userEmail = session.user.email?.toLowerCase();
  if (invite.inviteEmail !== userEmail) {
    return Response.json(
      { error: "Este convite foi enviado para outro email" },
      { status: 403 }
    );
  }

  const updated = await prisma.accountMember.update({
    where: { id: invite.id },
    data: { memberId: session.user.id, status: "active" },
  });

  return Response.json({ success: true, invite: updated, owner: invite.owner });
}
