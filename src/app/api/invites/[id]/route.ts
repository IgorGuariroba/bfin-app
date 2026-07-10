import { auth } from "@/lib/auth";
import { invitesClient } from "@/lib/invites-client";
import { backendErrorResponseOrRethrow } from "@/lib/backend-client";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await invitesClient.revoke(session.user.id, id);
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }

  return Response.json({ success: true });
}
