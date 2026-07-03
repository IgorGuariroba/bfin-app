import { auth } from "@/lib/auth";
import { membersService } from "@/adapters";
import { InviteNotFoundError } from "@/core/identity";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await membersService.revokeInvite(session.user.id, id);
  } catch (error) {
    if (error instanceof InviteNotFoundError) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }

  return Response.json({ success: true });
}
