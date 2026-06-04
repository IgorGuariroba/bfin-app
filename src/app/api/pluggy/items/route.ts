import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";

/** Lista os bancos conectados ao pool da conta efetiva (owner). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await getEffectiveUserId(session.user.id);

  const items = await prisma.pluggyItem.findMany({
    where: { userId },
    select: {
      id: true,
      connector: true,
      status: true,
      lastSyncedAt: true,
      connectedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(items);
}
