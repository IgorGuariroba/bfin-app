import { auth } from "@/lib/auth";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserId } from "@/lib/effective-user";
import { ensurePluggyItem, syncItemTransactions } from "@/lib/pluggy/sync";

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

/**
 * Registra um Item recém-conectado pelo widget (onSuccess do PluggyConnect).
 * Não dependemos só do webhook item/created: ele pode demorar ou ser rejeitado
 * (allowlist de IP atrás de proxy), deixando a UI eternamente "desconectada".
 * Aqui persistimos na hora, com o usuário autenticado. O webhook segue cuidando
 * dos updates contínuos. Idempotente: ensurePluggyItem faz upsert por itemId.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { itemId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const itemId = body.itemId?.trim();
  if (!itemId) return Response.json({ error: "itemId obrigatório" }, { status: 400 });

  // Pool = conta efetiva (owner); connectedBy = quem clicou (sessão atual).
  const ownerId = await getEffectiveUserId(session.user.id);

  try {
    await ensurePluggyItem(itemId, ownerId, session.user.id);
  } catch (err) {
    console.error("[pluggy] register item error:", err);
    return Response.json({ error: "Falha ao registrar banco" }, { status: 500 });
  }

  // Primeira sync em background: responde rápido pra UI já mostrar o banco.
  after(async () => {
    try {
      await syncItemTransactions(itemId);
    } catch (err) {
      console.error("[pluggy] first sync failed:", err);
    }
  });

  return Response.json({ ok: true });
}
