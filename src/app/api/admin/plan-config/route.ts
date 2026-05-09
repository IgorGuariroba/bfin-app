import "server-only";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "1g0r.guari@gmail.com";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  const config = await prisma.planConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", monthlyAmount: 14.9, annualAmount: 119.9 },
  });

  return Response.json(config);
}

export async function POST(request: Request) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { monthlyAmount, annualAmount } = await request.json();
  if (typeof monthlyAmount !== "number" || typeof annualAmount !== "number") {
    return Response.json({ error: "Valores inválidos" }, { status: 400 });
  }

  const config = await prisma.planConfig.upsert({
    where: { id: "default" },
    update: { monthlyAmount, annualAmount },
    create: { id: "default", monthlyAmount, annualAmount },
  });

  return Response.json(config);
}
