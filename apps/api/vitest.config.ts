import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      exclude: ["**/node_modules/**", ".next/**"],
      environment: "node",
      env: env,
    },
  };
});
