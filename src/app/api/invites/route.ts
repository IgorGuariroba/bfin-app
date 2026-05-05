import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const cookieStore = await cookies();
  const activeOwnerId = cookieStore.get("active-account")?.value ?? null;
  const preferredOwnerId = cookieStore.get("preferred-account")?.value ?? null;

  const [sent, received] = await Promise.all([
    prisma.accountMember.findMany({
      where: { ownerId: userId },
      include: { member: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountMember.findMany({
      where: { memberId: userId, status: "active" },
      include: { owner: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return Response.json({ sent, received, activeOwnerId, preferredOwnerId });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { email } = body;

  if (!email || typeof email !== "string") {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === session.user.email?.toLowerCase()) {
    return Response.json({ error: "Não pode convidar a si mesmo" }, { status: 400 });
  }

  const existing = await prisma.accountMember.findFirst({
    where: {
      ownerId: session.user.id,
      inviteEmail: normalizedEmail,
      status: { in: ["pending", "active"] },
    },
  });

  if (existing) {
    return Response.json({ error: "Convite já enviado para este email" }, { status: 400 });
  }

  const inviteToken = crypto.randomUUID();

  const invite = await prisma.accountMember.create({
    data: {
      ownerId: session.user.id,
      inviteEmail: normalizedEmail,
      inviteToken,
      role: "editor",
      status: "pending",
    },
  });

  const origin = request.nextUrl.origin;
  const inviteUrl = `${origin}/convite/${inviteToken}`;

  return Response.json({ invite, inviteUrl }, { status: 201 });
}
