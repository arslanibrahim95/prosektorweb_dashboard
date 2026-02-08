import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@prosektor/contracts"],
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      zod: "./node_modules/zod",
    },
  },
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
