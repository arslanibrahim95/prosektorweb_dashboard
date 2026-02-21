#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = path.join(ROOT, "apps/api/src/app/api");
const OUTPUT_PATH = path.join(ROOT, "docs/api/backend-hardening-inventory.md");

const CHECK_MODE = process.argv.includes("--check");

function walkRouteFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkRouteFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name === "route.ts") {
      files.push(full);
    }
  }

  return files;
}

function analyzeRoute(filePath) {
  const rel = path.relative(ROUTES_DIR, filePath).replaceAll(path.sep, "/");
  const source = fs.readFileSync(filePath, "utf8");

  const isPublicRoute = rel.startsWith("public/");
  const isDocsRoute = rel.startsWith("docs/");
  const isAuthExchange = rel === "auth/token/route.ts";
  const isCompatRedirect = rel === "hr/applications/[id]/cv-url/route.ts";
  const isExempt = isPublicRoute || isDocsRoute || isAuthExchange || isCompatRedirect;

  const usesHandlerFactory =
    /createInboxHandler\(|createExportHandler\(|createBulkReadHandler\(|createMarkReadHandler\(/.test(source) ||
    /export\s+\{\s*[^}]+\s+as\s+(GET|POST|PATCH|DELETE)\s*\};?/.test(source);
  const requiresAuthContext = /requireAuthContext\(/.test(source);
  const usesTokenAuthGuard = /getBearerToken\(/.test(source);
  const usesAuthRouteRateLimit = /enforceAuthRouteRateLimit\(/.test(source);
  const usesAdminRateLimit = /enforceAdminRateLimit\(/.test(source);
  const usesCustomRateLimit = /enforceRateLimit\(/.test(source);

  const usesStandardErrorPattern =
    /withAdminErrorHandling\(/.test(source) || /jsonError\(\s*asErrorBody\(/.test(source);

  const authCovered = isExempt || usesHandlerFactory || requiresAuthContext || usesTokenAuthGuard;
  const rateCovered =
    isExempt ||
    usesHandlerFactory ||
    usesAuthRouteRateLimit ||
    usesAdminRateLimit ||
    usesCustomRateLimit;
  const errorCovered = isExempt || usesHandlerFactory || usesStandardErrorPattern;

  const needsAction = !(authCovered && rateCovered && errorCovered);

  const notes = [];
  if (isExempt) notes.push("exempt");
  if (usesHandlerFactory) notes.push("handler-factory");
  if (usesAuthRouteRateLimit) notes.push("auth-rate-limit");
  if (usesAdminRateLimit) notes.push("admin-rate-limit");
  if (usesCustomRateLimit) notes.push("custom-rate-limit");
  if (usesStandardErrorPattern) notes.push("std-error");

  return {
    path: `apps/api/src/app/api/${rel}`,
    authCovered,
    rateCovered,
    errorCovered,
    needsAction,
    notes: notes.join(", ") || "-",
  };
}

function yesNo(v) {
  return v ? "yes" : "no";
}

function generateMarkdown(rows) {
  const total = rows.length;
  const authOk = rows.filter((row) => row.authCovered).length;
  const rateOk = rows.filter((row) => row.rateCovered).length;
  const errorOk = rows.filter((row) => row.errorCovered).length;
  const needsAction = rows.filter((row) => row.needsAction);

  const sorted = [...rows].sort((a, b) => {
    if (a.needsAction !== b.needsAction) return a.needsAction ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  const lines = [];
  lines.push("# Backend Hardening Inventory");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Coverage Summary");
  lines.push("");
  lines.push(`- Total routes: ${total}`);
  lines.push(`- Auth guard coverage: ${authOk}/${total}`);
  lines.push(`- Rate-limit coverage: ${rateOk}/${total}`);
  lines.push(`- Standard error handling coverage: ${errorOk}/${total}`);
  lines.push(`- Needs action: ${needsAction.length}`);
  lines.push("");
  lines.push("## Route Matrix");
  lines.push("");
  lines.push("| Route | Auth | Rate Limit | Error Pattern | Status | Notes |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const row of sorted) {
    lines.push(
      `| \`${row.path}\` | ${yesNo(row.authCovered)} | ${yesNo(row.rateCovered)} | ${yesNo(row.errorCovered)} | ${row.needsAction ? "needs-action" : "ok"} | ${row.notes} |`,
    );
  }
  lines.push("");

  if (needsAction.length > 0) {
    lines.push("## Needs Action");
    lines.push("");
    for (const row of needsAction) {
      lines.push(`- \`${row.path}\``);
    }
    lines.push("");
  }

  lines.push("## Notes");
  lines.push("");
  lines.push("- `handler-factory` routes are covered indirectly by shared inbox/export handlers.");
  lines.push("- `exempt` routes are public/docs/auth-exchange or compatibility redirects.");
  lines.push("- `custom-rate-limit` means route uses `enforceRateLimit` directly instead of helper wrappers.");
  lines.push("");

  return { markdown: lines.join("\n"), needsActionCount: needsAction.length };
}

function main() {
  if (!fs.existsSync(ROUTES_DIR)) {
    console.error(`Missing routes dir: ${path.relative(ROOT, ROUTES_DIR)}`);
    process.exit(1);
  }

  const routeFiles = walkRouteFiles(ROUTES_DIR);
  const rows = routeFiles.map(analyzeRoute);
  const { markdown, needsActionCount } = generateMarkdown(rows);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, markdown, "utf8");
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)} (${rows.length} routes)`); // eslint-disable-line no-console

  if (CHECK_MODE && needsActionCount > 0) {
    console.error(`Inventory check failed: ${needsActionCount} route(s) need action.`); // eslint-disable-line no-console
    process.exit(1);
  }
}

main();
