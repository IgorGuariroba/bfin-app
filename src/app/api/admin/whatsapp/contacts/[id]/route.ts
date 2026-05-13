import "server-only";
import { prisma } from "@/lib/prisma";
import { requireAdminOr403 } from "@/lib/admin-route";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  await prisma.whatsappContact.delete({ where: { id } }).catch(() => null);
  return Response.json({ ok: true });
}
