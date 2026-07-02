import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { membersService } from "@/adapters";
import { InviteValidationError, ProRequiredError } from "@/core/identity";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const activeOwnerId = cookieStore.get("active-account")?.value ?? null;
  const preferredOwnerId = cookieStore.get("preferred-account")?.value ?? null;

  const { sent, received } = await membersService.listInvites(session.user.id);

  return Response.json({ sent, received, activeOwnerId, preferredOwnerId });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();

  try {
    const invite = await membersService.createInvite({
      ownerId: session.user.id,
      ownerEmail: session.user.email,
      email,
    });

    const origin = process.env.AUTH_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;
    const inviteUrl = `${origin}/convite/${invite.inviteToken}`;

    return Response.json({ invite, inviteUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof ProRequiredError) {
      return Response.json(
        { error: "Convites disponíveis apenas no plano Pro", upgrade: true },
        { status: 403 }
      );
    }
    if (error instanceof InviteValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
