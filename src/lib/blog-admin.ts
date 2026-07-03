import "server-only";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export async function requireBlogAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email) || !session?.user?.id) {
    logger.warn({ email: session?.user?.email ?? null }, "admin: access denied");
    return null;
  }
  return session;
}
