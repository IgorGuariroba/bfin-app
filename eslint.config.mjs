import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
