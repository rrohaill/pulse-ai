#!/usr/bin/env node

/**
 * Prepares the Next.js standalone build for Electron packaging.
 *
 * Run after `npm run build` and before `electron-builder`:
 *   1. Copies .next/standalone/ → standalone-app/
 *   2. Copies .next/static/ → standalone-app/.next/static/
 *   3. Copies public/ → standalone-app/public/
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");
const outputDir = path.join(root, "standalone-app");

function log(msg) {
  console.log(`[prepare-electron] ${msg}`);
}

// Verify standalone build exists
if (!fs.existsSync(standaloneDir)) {
  console.error(
    "[prepare-electron] ERROR: .next/standalone/ not found.\n" +
      "Make sure next.config.ts has `output: 'standalone'` and run `npm run build` first."
  );
  process.exit(1);
}

// Clean previous output
if (fs.existsSync(outputDir)) {
  log("Cleaning previous standalone-app/...");
  fs.rmSync(outputDir, { recursive: true, force: true });
}

// Step 1: Copy standalone output
log("Copying .next/standalone/ → standalone-app/...");
execSync(`cp -R "${standaloneDir}" "${outputDir}"`, { stdio: "inherit" });

// Step 2: Copy static assets (not included in standalone by default)
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(outputDir, ".next", "static");
if (fs.existsSync(staticSrc)) {
  log("Copying .next/static/ → standalone-app/.next/static/...");
  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  execSync(`cp -R "${staticSrc}" "${staticDest}"`, { stdio: "inherit" });
} else {
  log("WARNING: .next/static/ not found, skipping");
}

// Step 3: Copy public assets
const publicSrc = path.join(root, "public");
const publicDest = path.join(outputDir, "public");
if (fs.existsSync(publicSrc)) {
  log("Copying public/ → standalone-app/public/...");
  execSync(`cp -R "${publicSrc}" "${publicDest}"`, { stdio: "inherit" });
} else {
  log("No public/ directory found, skipping");
}

// Step 4: Rebuild better-sqlite3 for Electron
log("Rebuilding better-sqlite3 for Electron...");
try {
  execSync("npx @electron/rebuild -f -w better-sqlite3", {
    cwd: root,
    stdio: "inherit",
  });
  log("Native module rebuilt for Electron");
} catch (err) {
  log("WARNING: Failed to rebuild better-sqlite3. The packaged app may not work.");
  log(err.message);
}

log("Done! standalone-app/ is ready for electron-builder.");
