import { auth } from "@/lib/auth";
import { invitesClient } from "@/lib/invites-client";
import { BackendError } from "@/lib/backend-client";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await invitesClient.revoke(session.user.id, id);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }

  return Response.json({ success: true });
}
