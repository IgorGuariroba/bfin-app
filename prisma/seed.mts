const { PrismaClient } = await import("../src/generated/prisma/client.ts");
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "bfin",
  }),
});

async function main() {
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@bfin.app" },
    update: { password: hashedPassword },
    create: {
      name: "Demo User",
      email: "demo@bfin.app",
      password: hashedPassword,
    },
  });

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { id: "tag-alimentacao" },
      update: {},
      create: { id: "tag-alimentacao", userId: user.id, name: "Alimentação", color: "#2db55d" },
    }),
    prisma.tag.upsert({
      where: { id: "tag-transporte" },
      update: {},
      create: { id: "tag-transporte", userId: user.id, name: "Transporte", color: "#ff385c" },
    }),
    prisma.tag.upsert({
      where: { id: "tag-lazer" },
      update: {},
      create: { id: "tag-lazer", userId: user.id, name: "Lazer", color: "#460479" },
    }),
  ]);

  const transactions = [
    { type: "entrada", description: "Salário", amount: 8000, date: new Date("2026-05-01") },
    { type: "saida", description: "Aluguel", amount: 2500, date: new Date("2026-05-01") },
    { type: "diario", description: "Supermercado", amount: 120, date: new Date("2026-05-02"), tagIds: ["tag-alimentacao"] },
    { type: "diario", description: "Uber", amount: 35, date: new Date("2026-05-03"), tagIds: ["tag-transporte"] },
    { type: "cartao", description: "Netflix", amount: 55.9, date: new Date("2026-05-04") },
    { type: "economia", description: "Reserva", amount: 1000, date: new Date("2026-05-05") },
    { type: "entrada", description: "Freelance", amount: 2000, date: new Date("2026-05-10") },
    { type: "saida", description: "Conta de luz", amount: 280, date: new Date("2026-05-10") },
    { type: "diario", description: "Restaurante", amount: 85, date: new Date("2026-05-12"), tagIds: ["tag-alimentacao", "tag-lazer"] },
  ];

  for (const t of transactions) {
    const { tagIds, ...data } = t as any;
    await prisma.transaction.create({
      data: {
        ...data,
        userId: user.id,
        tags: tagIds
          ? { connect: tagIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
  }

  await prisma.previsao.createMany({
    data: [
      { userId: user.id, name: "Combustível", amount: 400 },
      { userId: user.id, name: "Supermercado", amount: 800 },
      { userId: user.id, name: "Streaming", amount: 120 },
      { userId: user.id, name: "Academia", amount: 150 },
    ],
  });

  console.log("Seed done:", { user: user.email, tags: tags.length, transactions: transactions.length });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
