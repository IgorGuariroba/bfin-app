import { defaultExclude, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": path.resolve("src/test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // unit: sem dependência de Postgres (roda no pre-commit). integration:
    // precisa de DATABASE_URL real (roda só no CI). Ver ADR-0015.
    projects: [
      {
        extends: true,
        test: { name: "unit", exclude: [...defaultExclude, "**/*.integration.test.ts"] },
      },
      {
        extends: true,
        test: { name: "integration", include: ["**/*.integration.test.ts"] },
      },
    ],
  },
});
