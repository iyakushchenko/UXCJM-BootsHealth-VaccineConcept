#!/usr/bin/env node
/**
 * Parity-proven hard gate — FAIL npm test when a React-migrated screen claims
 * ship without a PROVEN FE audit that includes MCP matrix evidence.
 *
 * Manifest: docs/projects/boots-pharmacy/audits/PARITY_PROVEN.json
 * Wire: npm run check:parity-proven (also via npm test)
 *
 * Policy: docs/product/TEAM.md · COMMAND_DOCTRINE.md · FE_UI_UX_AUDIT.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_REL =
  "docs/projects/boots-pharmacy/audits/PARITY_PROVEN.json";

/** Fallback if manifest omits requiredScreens — keep in sync with mounts. */
const REACT_MIGRATED_SCREENS = [
  "book-step-1",
  "book-step-2",
  "book-step-3",
  "plp",
  "pdp",
];

const MCP_EVIDENCE_RE =
  /##\s*.*\bMCP\b|\bMCP\b[\s\S]{0,80}\bmatrix\b|\bQuinn\b[\s\S]{0,40}\bMCP\b|__studioRunMcpPageProbe|__protoRunMcpPageProbe|__studioRunMcpSanityCheck|__protoRunMcpSanityCheck|MCP real-user|MCP evidence|MCP localhost/i;

const PROVEN_RE = /\bPROVEN\b/;
const REVOKED_OVERALL_RE =
  /\|\s*\*\*Overall\*\*\s*\|\s*\*\*REVOKED\*\*|\bOverall\b[^\n]{0,40}\bREVOKED\b/i;

const errors = [];
const fail = (msg) => errors.push(msg);

const manifestPath = path.join(ROOT, MANIFEST_REL);
if (!fs.existsSync(manifestPath)) {
  fail(`missing parity manifest: ${MANIFEST_REL}`);
  printAndExit();
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (err) {
  fail(`invalid JSON in ${MANIFEST_REL}: ${err.message}`);
  printAndExit();
}

const required = Array.isArray(manifest.requiredScreens)
  ? manifest.requiredScreens
  : REACT_MIGRATED_SCREENS;

if (!Array.isArray(manifest.screens) || manifest.screens.length === 0) {
  fail(`${MANIFEST_REL}: screens[] required`);
  printAndExit();
}

const byId = new Map();
for (const entry of manifest.screens) {
  if (!entry?.screenId) {
    fail(`${MANIFEST_REL}: screen entry missing screenId`);
    continue;
  }
  if (byId.has(entry.screenId)) {
    fail(`${MANIFEST_REL}: duplicate screenId "${entry.screenId}"`);
  }
  byId.set(entry.screenId, entry);
}

for (const screenId of required) {
  const entry = byId.get(screenId);
  if (!entry) {
    fail(
      `React-migrated screen "${screenId}" missing from ${MANIFEST_REL} screens[]`
    );
    continue;
  }

  const status = String(entry.status || "").toLowerCase();
  if (status !== "proven") {
    fail(
      `${screenId}: status must be "proven" (got "${entry.status ?? ""}") — no ship without PROVEN parity`
    );
  }

  if (!entry.auditPath || typeof entry.auditPath !== "string") {
    fail(`${screenId}: auditPath required`);
    continue;
  }

  const auditAbs = path.join(ROOT, entry.auditPath);
  if (!fs.existsSync(auditAbs)) {
    fail(`${screenId}: audit file missing: ${entry.auditPath}`);
    continue;
  }

  const auditBody = fs.readFileSync(auditAbs, "utf8");

  if (REVOKED_OVERALL_RE.test(auditBody)) {
    fail(
      `${screenId}: audit Overall is REVOKED (${entry.auditPath}) — remove from proven or re-audit`
    );
  }

  if (!PROVEN_RE.test(auditBody)) {
    fail(
      `${screenId}: audit must contain PROVEN (${entry.auditPath})`
    );
  }

  const requireMcp = entry.requireMcp !== false;
  if (requireMcp && !MCP_EVIDENCE_RE.test(auditBody)) {
    fail(
      `${screenId}: audit missing MCP / matrix evidence section (${entry.auditPath}). Quinn+Ben must run __studioRunMcpPageProbe (or document MCP matrix) before PROVEN.`
    );
  }

  const mcpAt = entry.mcpMatrixAt;
  if (!mcpAt || typeof mcpAt !== "object") {
    fail(`${screenId}: mcpMatrixAt { sha, date } required`);
  } else {
    if (!mcpAt.sha || typeof mcpAt.sha !== "string") {
      fail(`${screenId}: mcpMatrixAt.sha required`);
    }
    if (!mcpAt.date || typeof mcpAt.date !== "string") {
      fail(`${screenId}: mcpMatrixAt.date required`);
    }
  }
}

// Extra screens in manifest with status proven still get validated above via loop;
// warn-as-fail if status is revoked string.
for (const entry of manifest.screens) {
  if (String(entry.status || "").toLowerCase() === "revoked") {
    fail(
      `${entry.screenId}: status "revoked" in manifest — CI fails until removed or re-proven`
    );
  }
}

printAndExit();

function printAndExit() {
  if (errors.length) {
    console.error("[check:parity-proven] FAIL — React screen parity gate:\n");
    for (const e of errors) console.error(`  • ${e}`);
    console.error(
      `\n[check:parity-proven] ${errors.length} violation(s). Seed/fix docs/projects/<id>/audits/PARITY_PROVEN.json + MCP matrix in the audit. See TEAM.md / COMMAND_DOCTRINE.md.`
    );
    process.exit(1);
  }
  console.log(
    `[check:parity-proven] OK — ${required.length} React-migrated screen(s) PROVEN with MCP evidence`
  );
}
