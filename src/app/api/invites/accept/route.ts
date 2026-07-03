import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { membersService } from "@/adapters";
import {
  InviteForbiddenError,
  InviteNotFoundError,
  InviteValidationError,
} from "@/core/identity";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await request.json();

  try {
    const { invite, owner } = await membersService.acceptInvite({
      userId: session.user.id,
      userEmail: session.user.email,
      token,
    });

    return Response.json({ success: true, invite, owner });
  } catch (error) {
    if (error instanceof InviteNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InviteForbiddenError) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof InviteValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
