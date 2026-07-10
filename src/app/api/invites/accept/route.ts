import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { invitesClient } from "@/lib/invites-client";
import { backendErrorResponse } from "@/lib/backend-client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await request.json();

  try {
    const { invite, owner } = await invitesClient.accept({
      userId: session.user.id,
      userEmail: session.user.email,
      token,
    });

    return Response.json({ success: true, invite, owner });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
