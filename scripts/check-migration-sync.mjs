#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGES_DIR = path.join(ROOT, "packages/db/migrations");
const SUPABASE_DIR = path.join(ROOT, "supabase/migrations");

const STRICT = process.argv.includes("--strict");

function listSqlBasenames(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
}

function analyzeSupabaseMigrations() {
  const entries = fs.readdirSync(SUPABASE_DIR, { withFileTypes: true });
  const symlinkTargets = [];
  const staleSymlinks = [];
  const standaloneFiles = [];

  for (const entry of entries) {
    if (!entry.name.endsWith(".sql")) continue;
    const fullPath = path.join(SUPABASE_DIR, entry.name);

    if (entry.isSymbolicLink()) {
      const linked = fs.readlinkSync(fullPath);
      const resolved = path.resolve(SUPABASE_DIR, linked);
      const basename = path.basename(resolved);
      const exists = fs.existsSync(resolved);
      if (!exists) {
        staleSymlinks.push({
          supabaseFile: entry.name,
          target: linked,
        });
        continue;
      }
      symlinkTargets.push({ supabaseFile: entry.name, targetBasename: basename });
      continue;
    }

    if (entry.isFile()) {
      standaloneFiles.push(entry.name);
    }
  }

  return { symlinkTargets, staleSymlinks, standaloneFiles };
}

function main() {
  if (!fs.existsSync(PACKAGES_DIR) || !fs.existsSync(SUPABASE_DIR)) {
    console.error("Missing migrations directories.");
    process.exit(1);
  }

  const packageMigrations = listSqlBasenames(PACKAGES_DIR);
  const { symlinkTargets, staleSymlinks, standaloneFiles } = analyzeSupabaseMigrations();
  const linkedSet = new Set(symlinkTargets.map((x) => x.targetBasename));

  const missingLinks = packageMigrations.filter((name) => !linkedSet.has(name));

  console.log("Migration Sync Report");
  console.log("=====================");
  console.log(`packages/db migrations: ${packageMigrations.length}`);
  console.log(`supabase symlinked migrations: ${symlinkTargets.length}`);
  console.log(`supabase standalone migrations: ${standaloneFiles.length}`);
  console.log(`missing symlink targets: ${missingLinks.length}`);
  console.log(`stale symlinks: ${staleSymlinks.length}`);
  console.log("");

  if (missingLinks.length > 0) {
    console.log("Missing symlink(s) for package migrations:");
    for (const file of missingLinks) console.log(`- ${file}`);
    console.log("");
  }

  if (staleSymlinks.length > 0) {
    console.log("Stale symlink(s):");
    for (const link of staleSymlinks) {
      console.log(`- ${link.supabaseFile} -> ${link.target}`);
    }
    console.log("");
  }

  if (standaloneFiles.length > 0) {
    console.log("Standalone supabase migration file(s):");
    for (const file of standaloneFiles) console.log(`- ${file}`);
    console.log("");
  }

  if (STRICT && (missingLinks.length > 0 || staleSymlinks.length > 0)) {
    process.exit(1);
  }
}

main();

