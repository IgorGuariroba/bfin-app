import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

// Pool único por processo (mesmo padrão do lib/prisma.ts): em dev o hot-reload
// recarrega módulos — sem o cache global, cada reload vazaria conexões.
const globalForDrizzle = globalThis as unknown as { drizzlePool?: Pool };

const pool =
  globalForDrizzle.drizzlePool ??
  new Pool({ connectionString: process.env.DATABASE_URL! });

if (process.env.NODE_ENV !== "production") globalForDrizzle.drizzlePool = pool;

export const db = drizzle(pool, { schema });
