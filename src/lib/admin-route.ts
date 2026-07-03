import "server-only";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export async function requireAdminOr403(): Promise<Response | null> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    logger.warn({ email: session?.user?.email ?? null }, "admin: access denied");
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
