import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/plan";
import { generateApiKey } from "@/lib/api-key";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  return Response.json(keys);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Emissão de token é feature Pro.
  const plan = await getUserPlan(session.user.id);
  if (plan !== "pro") {
    return Response.json({ error: "plan_required", upgrade: true }, { status: 403 });
  }

  // 1 token ativo por vez: revoga as anteriores antes de criar a nova.
  await prisma.apiKey.updateMany({
    where: { userId: session.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const { plain, prefix, hashedKey } = generateApiKey();
  const created = await prisma.apiKey.create({
    data: { userId: session.user.id, name: "Assistente", prefix, hashedKey },
    select: { id: true, prefix: true, name: true, createdAt: true },
  });

  // plain é devolvido apenas aqui — nunca mais é recuperável.
  return Response.json({ ...created, plain }, { status: 201 });
}
