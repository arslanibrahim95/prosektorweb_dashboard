import { defineConfig } from "vitest/config";
import fs from "fs";
import path from "path";

function loadEnvFiles(mode: string, cwd: string): Record<string, string> {
  const files = [
    ".env",
    ".env.local",
    mode ? `.env.${mode}` : "",
    mode ? `.env.${mode}.local` : "",
  ].filter(Boolean);

  const env: Record<string, string> = {};

  for (const file of files) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key) env[key] = value;
    }
  }

  return env;
}

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnvFiles(mode, process.cwd()),
    ...Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => typeof value === "string"),
    ),
  };
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
