import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { ownerId, preferred = false } = body;

  const cookieStore = await cookies();

  if (!ownerId) {
    cookieStore.delete("active-account");
    cookieStore.delete("preferred-account");
    return Response.json({ success: true, effectiveUserId: session.user.id });
  }

  const member = await prisma.accountMember.findFirst({
    where: { ownerId, memberId: session.user.id, status: "active" },
  });

  if (!member) {
    return Response.json({ error: "Sem permissão para acessar esta conta" }, { status: 403 });
  }

  const base = { httpOnly: true, sameSite: "lax" as const, path: "/" };

  cookieStore.set("active-account", ownerId, { ...base, maxAge: 60 * 60 * 8 });

  if (preferred) {
    cookieStore.set("preferred-account", ownerId, { ...base, maxAge: 60 * 60 * 24 * 365 });
  } else {
    cookieStore.delete("preferred-account");
  }

  return Response.json({ success: true, effectiveUserId: ownerId });
}
