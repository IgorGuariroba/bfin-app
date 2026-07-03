import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { whatsappContact } from "@/db/schema";
import { requireAdminOr403 } from "@/lib/admin-route";

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const forbidden = await requireAdminOr403();
  if (forbidden) return forbidden;

  const { id } = await ctx.params;
  await db.delete(whatsappContact).where(eq(whatsappContact.id, id)).catch(() => null);
  return Response.json({ ok: true });
}
