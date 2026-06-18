import { loadEnvConfig } from "@next/env";

// Vitest não carrega .env/.env.local automaticamente (o Next faz isso em runtime).
loadEnvConfig(process.cwd());
