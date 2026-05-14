import "server-only";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function requireBlogAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email) || !session?.user?.id) return null;
  return session;
}
