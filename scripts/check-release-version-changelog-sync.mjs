#!/usr/bin/env node
/**
 * package.json version must match the latest ## vX.Y.Z heading in CHANGELOG.md.
 * Adapted from Summarizer scripts/check-release-version-changelog-sync.mjs (lean).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(root, "package.json");
const changelogPath = path.join(root, "CHANGELOG.md");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const packageVersion = String(pkg.version || "").trim();

if (!/^\d+\.\d+\.\d+$/.test(packageVersion)) {
  console.error(
    `[check:version] Invalid package.json version: ${packageVersion || "(empty)"}`
  );
  process.exit(1);
}

if (!fs.existsSync(changelogPath)) {
  console.error("[check:version] CHANGELOG.md not found.");
  process.exit(1);
}

const lines = fs.readFileSync(changelogPath, "utf8").split(/\r?\n/);
const headingRegex = /^## v(\d+\.\d+\.\d+)\s*-\s*\d{6}\b/;

let latestReleasedVersion = null;
for (const line of lines) {
  const match = line.match(headingRegex);
  if (match) {
    latestReleasedVersion = match[1];
    break;
  }
}

if (!latestReleasedVersion) {
  console.error(
    "[check:version] No released version heading found in CHANGELOG.md (expected ## vX.Y.Z - DDMMYY)."
  );
  process.exit(1);
}

if (latestReleasedVersion !== packageVersion) {
  console.error(
    `[check:version] package.json (${packageVersion}) ≠ latest CHANGELOG heading (${latestReleasedVersion}).`
  );
  process.exit(1);
}

console.log(
  `[check:version] OK — package.json and CHANGELOG.md both at v${packageVersion}.`
);
