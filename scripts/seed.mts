import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { toDbTimestamp } from "../src/adapters/drizzle/timestamp";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const [user] = await db
    .insert(schema.user)
    .values({ id: crypto.randomUUID(), name: "Demo User", email: "demo@bfin.app", password: hashedPassword })
    .onConflictDoUpdate({ target: schema.user.email, set: { password: hashedPassword } })
    .returning();

  // Tags de sistema (padrão, não editáveis)
  const systemTagDefs = [
    { name: "Entradas", color: "#2db55d" },
    { name: "Saídas", color: "#ff385c" },
    { name: "Diários", color: "#92174d" },
    { name: "Economias", color: "#2db55d" },
  ];

  for (const st of systemTagDefs) {
    await db
      .insert(schema.tag)
      .values({ id: crypto.randomUUID(), userId: user.id, name: st.name, color: st.color, isSystem: true })
      .onConflictDoUpdate({ target: [schema.tag.userId, schema.tag.name], set: { isSystem: true } });
  }

  // Tags do usuário (editáveis)
  const tagDefs = [
    { id: "tag-alimentacao", name: "Alimentação", color: "#2db55d" },
    { id: "tag-transporte", name: "Transporte", color: "#ff385c" },
    { id: "tag-lazer", name: "Lazer", color: "#460479" },
  ];
  const tags = [];
  for (const t of tagDefs) {
    const [row] = await db
      .insert(schema.tag)
      .values({ id: t.id, userId: user.id, name: t.name, color: t.color })
      .onConflictDoUpdate({ target: schema.tag.id, set: { id: sql`excluded.id` } })
      .returning();
    tags.push(row);
  }

  await db.delete(schema.transaction).where(eq(schema.transaction.userId, user.id));
  await db.delete(schema.previsao).where(eq(schema.previsao.userId, user.id));

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

  const now = toDbTimestamp(new Date());
  for (const t of transactions) {
    const { tagIds, ...data } = t;
    const id = crypto.randomUUID();
    await db.insert(schema.transaction).values({
      id,
      userId: user.id,
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: toDbTimestamp(data.date),
      updatedAt: now,
    });
    if (tagIds?.length) {
      await db.insert(schema.tagToTransaction).values(tagIds.map((tagId) => ({ a: tagId, b: id })));
    }
  }

  await db.insert(schema.previsao).values([
    { id: crypto.randomUUID(), userId: user.id, name: "Combustível", amount: 400 },
    { id: crypto.randomUUID(), userId: user.id, name: "Supermercado", amount: 800 },
    { id: crypto.randomUUID(), userId: user.id, name: "Streaming", amount: 120 },
    { id: crypto.randomUUID(), userId: user.id, name: "Academia", amount: 150 },
  ]);

  console.log("Seed done:", { user: user.email, tags: tags.length, transactions: transactions.length });
}

main()
  .catch(console.error)
  .finally(() => pool.end());
