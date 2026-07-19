#!/usr/bin/env node
/**
 * Lean release-notes helper (Summarizer-inspired, Studio-sized).
 * Commands: list | append | preview | check
 *
 * Usage:
 *   node scripts/release-notes.mjs list
 *   node scripts/release-notes.mjs append --lane=engine --intent="…"
 *   node scripts/release-notes.mjs preview
 *   node scripts/release-notes.mjs check
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");

const VALID_LANES = new Set([
  "engine",
  "project",
  "shell",
  "uxds",
  "docs",
  "chore",
]);

const CURRENT_HEADING = "## Current (in flight)";
const CURRENT_BLOCKQUOTE = `> _Append a bullet on coherent commits via \`npm run notes:append -- --lane="<lane>" --intent="<text>"\`. Preview with \`npm run notes:preview\`. On \`npm run release:patch\` this section is promoted to \`## v<X.Y.Z> - DDMMYY\` and a fresh empty \`## Current\` is re-inserted. Policy: \`docs/product/VERSIONING.md\`._`;

const parseArgs = (argv) => {
  const out = { _: [] };
  for (const a of argv) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) out[a.slice(2)] = true;
      else out[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      out._.push(a);
    }
  }
  return out;
};

const parseCurrent = (text) => {
  const lines = text.split(/\r?\n/);
  let currentStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^## Current\b/i.test(lines[i])) {
      currentStart = i;
      break;
    }
  }
  if (currentStart === -1) return null;
  let nextHeadingStart = lines.length;
  for (let j = currentStart + 1; j < lines.length; j++) {
    if (/^## /.test(lines[j])) {
      nextHeadingStart = j;
      break;
    }
  }
  let bodyStart = currentStart + 1;
  while (bodyStart < nextHeadingStart && lines[bodyStart].trim() === "") bodyStart++;
  while (bodyStart < nextHeadingStart && lines[bodyStart].startsWith(">")) bodyStart++;
  while (bodyStart < nextHeadingStart && lines[bodyStart].trim() === "") bodyStart++;
  let bodyEnd = nextHeadingStart - 1;
  while (bodyEnd >= bodyStart && lines[bodyEnd].trim() === "") bodyEnd--;
  const bodyLines = bodyEnd >= bodyStart ? lines.slice(bodyStart, bodyEnd + 1) : [];
  return {
    allLines: lines,
    currentStart,
    nextHeadingStart,
    bodyLines,
    body: bodyLines.join("\n"),
  };
};

const ensureChangelog = () => {
  if (fs.existsSync(CHANGELOG_PATH)) return;
  const seed = [
    CURRENT_HEADING,
    "",
    CURRENT_BLOCKQUOTE,
    "",
    "",
  ].join("\n");
  fs.writeFileSync(CHANGELOG_PATH, seed);
  console.log("[notes] Created CHANGELOG.md with empty ## Current.");
};

const cmdList = () => {
  ensureChangelog();
  const current = parseCurrent(fs.readFileSync(CHANGELOG_PATH, "utf8"));
  if (!current) {
    console.error("[notes] No ## Current block in CHANGELOG.md");
    process.exit(1);
  }
  const bullets = current.bodyLines.filter((l) => /^[-*]\s+/.test(l.trim()));
  if (!bullets.length) {
    console.log("[notes] ## Current is empty.");
    return;
  }
  console.log("[notes] ## Current:");
  for (const b of bullets) console.log(b);
};

const cmdAppend = (args) => {
  const lane = String(args.lane || "").trim();
  const intent = String(args.intent || "").trim();
  if (!lane || !VALID_LANES.has(lane)) {
    console.error(
      `[notes] --lane required. One of: ${[...VALID_LANES].join(", ")}`
    );
    process.exit(1);
  }
  if (!intent) {
    console.error('[notes] --intent="…" required.');
    process.exit(1);
  }
  ensureChangelog();
  const text = fs.readFileSync(CHANGELOG_PATH, "utf8");
  let current = parseCurrent(text);
  if (!current) {
    const top = [CURRENT_HEADING, "", CURRENT_BLOCKQUOTE, "", `- **${lane}:** ${intent}`, "", ""].join(
      "\n"
    );
    fs.writeFileSync(CHANGELOG_PATH, top + text.replace(/^\s*\n/, ""));
    console.log(`[notes] Appended (${lane}): ${intent}`);
    return;
  }
  const bullet = `- **${lane}:** ${intent}`;
  const existing = new Set(
    current.bodyLines.map((l) => l.trim().replace(/^[-*]\s+/, "").trim())
  );
  const key = bullet.replace(/^[-*]\s+/, "").trim();
  if (existing.has(key)) {
    console.log("[notes] Duplicate bullet skipped.");
    return;
  }
  const before = current.allLines.slice(0, current.currentStart);
  const after = current.allLines.slice(current.nextHeadingStart);
  const currentBlock = [
    CURRENT_HEADING,
    "",
    CURRENT_BLOCKQUOTE,
    "",
    ...current.bodyLines,
    bullet,
    "",
  ];
  const next = [...before, ...currentBlock, ...after];
  const joined = next.join("\n").replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(CHANGELOG_PATH, joined.endsWith("\n") ? joined : joined + "\n");
  console.log(`[notes] Appended (${lane}): ${intent}`);
};

const cmdPreview = () => {
  ensureChangelog();
  const current = parseCurrent(fs.readFileSync(CHANGELOG_PATH, "utf8"));
  if (!current || !current.body.trim()) {
    console.log("- Maintenance update");
    return;
  }
  console.log(current.body.trim());
};

const cmdCheck = () => {
  ensureChangelog();
  const text = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const current = parseCurrent(text);
  if (!current) {
    console.error("[notes] FAIL — missing ## Current block.");
    process.exit(1);
  }
  const bullets = current.bodyLines.filter((l) => /^[-*]\s+/.test(l.trim()));
  console.log(
    `[notes] OK — ## Current present (${bullets.length} bullet${bullets.length === 1 ? "" : "s"}).`
  );
  console.log(
    "[notes] Tip: run `npm run check:version` to sync package.json ↔ latest ## v heading."
  );
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || "list";
  if (cmd === "list") cmdList();
  else if (cmd === "append") cmdAppend(args);
  else if (cmd === "preview") cmdPreview();
  else if (cmd === "check") cmdCheck();
  else {
    console.error(`[notes] Unknown command: ${cmd}`);
    process.exit(1);
  }
};

main();
