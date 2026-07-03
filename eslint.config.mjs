import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Prisma foi descomissionado do repo inteiro (#154): só Drizzle a partir
  // daqui. Vem antes da regra do core para que a regra mais específica do
  // core (abaixo) prevaleça lá — no flat config, a última regra que casa o
  // arquivo vence por completo, sem merge.
  {
    files: ["**/*.{ts,tsx,mts,mjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/*", "prisma/config"],
              message: "Prisma foi removido do repositório (#154) — use Drizzle (@/lib/drizzle, @/db/schema).",
            },
          ],
        },
      ],
    },
  },
  // Fronteira do core (ADR-0013): src/core é agnóstico de framework e ORM.
  // A dependência aponta para dentro — todo mundo importa o core; o core não
  // importa ninguém. É esta regra (e não "server-only") que protege o core de
  // ser importado com dependências de servidor em client components.
  {
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message: "src/core é agnóstico de Next (ADR-0013); a fronteira é imposta por lint, não por server-only.",
            },
          ],
          patterns: [
            {
              group: ["next", "next/*", "next-auth", "next-auth/*", "react", "react/*", "react-dom", "react-dom/*"],
              message: "src/core não importa framework (ADR-0013).",
            },
            {
              group: ["@prisma/*", "@/generated/*", "**/generated/prisma/*", "**/lib/prisma"],
              message: "src/core não conhece ORM — acesso a dados só via portas implementadas em src/adapters (ADR-0013).",
            },
            {
              group: ["@/app/*", "@/adapters/*", "@/lib/*", "@/components/*", "@/hooks/*"],
              message: "Dependência aponta para dentro: src/core não importa app, adapters, lib, components ou hooks (ADR-0013).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts vendorados de skills de agentes — não são código do app (#119).
    ".agents/**",
    ".claude/skills/**",
    ".codex/**",
    ".gemini/**",
    ".github/skills/**",
    ".impeccable/**",
  ]),
]);

export default eslintConfig;
