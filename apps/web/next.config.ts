import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const isProduction = process.env.NODE_ENV === "production";

function resolveApiOrigin(rawOrigin: string | undefined): string | null {
  const candidate = rawOrigin?.trim();
  if (!candidate) return null;

  try {
    const parsed = new URL(candidate);
    const isLoopbackHost = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]).has(parsed.hostname);

    if (isProduction && isLoopbackHost) {
      console.warn(
        `[next.config] Ignoring loopback API_ORIGIN in production: ${parsed.origin}`,
      );
      return null;
    }

    return parsed.origin;
  } catch {
    console.warn(`[next.config] Ignoring invalid API_ORIGIN: ${candidate}`);
    return null;
  }
}

const apiOrigin = resolveApiOrigin(process.env.API_ORIGIN) ?? (isProduction ? null : "http://localhost:3001");
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];
const hstsHeaders =
  process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
    : [];
const csp =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:;";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    if (!apiOrigin) {
      return [];
    }

    return [{
      source: "/api/:path*",
      destination: `${apiOrigin}/api/:path*`,
    }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          ...hstsHeaders,
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
