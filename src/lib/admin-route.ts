import "server-only";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function requireAdminOr403(): Promise<Response | null> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
