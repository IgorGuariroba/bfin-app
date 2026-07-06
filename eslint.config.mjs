import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Prisma foi descomissionado do repo inteiro (#154): só Drizzle a partir
  // daqui.
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
