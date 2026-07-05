import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Dono das migrations desde a introdução do Drizzle (ADR-0014) até a ADR-0017:
// a posse do schema/migrations passou para o bfin-backend (repo separado),
// que já tem sua própria cópia. Este arquivo/pasta drizzle/ ficam congelados
// aqui só para não quebrar os adapters de src/core enquanto cada agregado não
// migra (issues #182–#191) — não gerar novas migrations por aqui.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
