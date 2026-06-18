import { defineConfig } from "vitest/config";
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
  },
});
