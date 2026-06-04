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

  // Tags de sistema (padrão, não editáveis)
  const systemTagDefs = [
    { name: "Entradas", color: "#2db55d" },
    { name: "Saídas",   color: "#ff385c" },
    { name: "Diários",  color: "#92174d" },
    { name: "Economias", color: "#2db55d" },
  ];

  for (const st of systemTagDefs) {
    await prisma.tag.upsert({
      where: { userId_name: { userId: user.id, name: st.name } },
      update: { isSystem: true },
      create: { userId: user.id, name: st.name, color: st.color, isSystem: true },
    });
  }

  // Tags do usuário (editáveis)
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

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.previsao.deleteMany({ where: { userId: user.id } });

  type SeedTx = {
    type: string;
    description: string;
    amount: number;
    date: Date;
    tagIds?: string[];
  };

  const transactions: SeedTx[] = [
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
    const { tagIds, ...data } = t;
    await prisma.transaction.create({
      data: {
        ...data,
        userId: user.id,
        tags: tagIds
          ? { connect: tagIds.map((id) => ({ id })) }
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
