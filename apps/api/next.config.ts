import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Allow importing TS sources from /packages/* (contracts) in both dev + build.
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["@prosektor/contracts"],
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      // Ensure a single Zod instance across workspace packages.
      zod: "./node_modules/zod",
    },
  },
  experimental: {
    externalDir: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
