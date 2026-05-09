import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.planConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", monthlyAmount: 14.9, annualAmount: 119.9 },
  });

  return Response.json({
    monthly: config.monthlyAmount,
    annual: config.annualAmount,
  });
}
