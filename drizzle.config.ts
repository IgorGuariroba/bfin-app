import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Dono das migrations desde a introdução do Drizzle (ADR-0014) até a ADR-0017:
// a posse do schema/migrations passou para o bfin-backend (repo separado).
// Este arquivo/pasta drizzle/ permanecem porque o bfin-app segue usando
// Drizzle direto contra o banco compartilhado na fatia própria dele (auth
// NextAuth + blog) — isso é permanente, não resto de migração. Só não gerar
// novas migrations por aqui: schema novo nasce no bfin-backend.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
