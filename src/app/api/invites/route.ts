import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { invitesClient } from "@/lib/invites-client";
import { BackendError, backendErrorResponse } from "@/lib/backend-client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const activeOwnerId = cookieStore.get("active-account")?.value ?? null;
  const preferredOwnerId = cookieStore.get("preferred-account")?.value ?? null;

  try {
    const { sent, received } = await invitesClient.list(session.user.id);
    return Response.json({ sent, received, activeOwnerId, preferredOwnerId });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();

  try {
    const invite = await invitesClient.create({
      ownerId: session.user.id,
      ownerEmail: session.user.email,
      email,
    });

    const origin = process.env.AUTH_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;
    const inviteUrl = `${origin}/convite/${invite.inviteToken}`;

    return Response.json({ invite, inviteUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError && error.status === 403) {
      return Response.json(
        { error: "Convites disponíveis apenas no plano Pro", upgrade: true },
        { status: 403 }
      );
    }
    return backendErrorResponse(error);
  }
}
