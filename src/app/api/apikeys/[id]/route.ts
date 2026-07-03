import { auth } from "@/lib/auth";
import { apiKeysService } from "@/adapters";
import { ApiKeyNotFoundError } from "@/core/apikeys";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await apiKeysService.revokeApiKey(session.user.id, id);
  } catch (error) {
    if (error instanceof ApiKeyNotFoundError) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }

  return Response.json({ success: true });
}
