import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function resolveServerPath(cwd) {
  const candidates = [
    path.join(cwd, "server.js"),
    path.join(cwd, ".next", "standalone", "apps", "web", "server.js"),
  ];

  for (const candidate of candidates) {
    if (exists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function ensureStaticAssets(appDir, cwd) {
  const targetStaticDir = path.join(appDir, ".next", "static");

  if (exists(targetStaticDir)) {
    return targetStaticDir;
  }

  const sourceCandidates = [
    path.join(cwd, ".next", "static"),
    path.join(cwd, "apps", "web", ".next", "static"),
    path.join(appDir, "..", "..", "..", "static"),
  ];

  for (const source of sourceCandidates) {
    if (!exists(source)) {
      continue;
    }

    fs.mkdirSync(path.dirname(targetStaticDir), { recursive: true });
    fs.cpSync(source, targetStaticDir, { recursive: true, force: true });
    console.info(`[standalone] Copied static assets from ${source} to ${targetStaticDir}`);
    return targetStaticDir;
  }

  return null;
}

async function main() {
  const cwd = process.cwd();
  const serverPath = resolveServerPath(cwd);

  if (!serverPath) {
    console.error(
      "[standalone] Could not find server.js. Expected one of: ./server.js or ./.next/standalone/apps/web/server.js",
    );
    process.exit(1);
    return;
  }

  const appDir = path.dirname(serverPath);
  const staticDir = ensureStaticAssets(appDir, cwd);

  if (!staticDir) {
    console.error(
      `[standalone] Missing static assets for Next.js app at ${appDir}. Ensure .next/static is copied before startup.`,
    );
    process.exit(1);
    return;
  }

  process.chdir(appDir);
  await import(pathToFileURL(serverPath).href);
}

main().catch((error) => {
  console.error("[standalone] Failed to start server:", error);
  process.exit(1);
});
