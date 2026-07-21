/** Guard the small set of documentation authority rules that previously drifted. */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

function requireText(file, pattern, reason) {
  const text = read(file);
  if (!pattern.test(text)) failures.push(`${file}: ${reason}`);
}

function forbidAcross(files, pattern, reason) {
  for (const file of files) {
    if (pattern.test(read(file))) failures.push(`${file}: ${reason}`);
  }
}

requireText("docs/product/DOC_GOVERNANCE.md", /^\*\*Type:\*\* Contract\s*$/m, "missing Type identity");
requireText("docs/product/DOC_GOVERNANCE.md", /^\*\*Owner:\*\* .+$/m, "missing Owner identity");
requireText("docs/product/DOC_GOVERNANCE.md", /^\*\*Status:\*\* Active\s*$/m, "governance contract must be Active");
requireText("docs/product/DOC_GOVERNANCE.md", /^\*\*Last verified:\*\* \d{4}-\d{2}-\d{2}\s*$/m, "missing Last verified date");
requireText("docs/product/NEXT_STEPS.md", /only mutable source of truth/i, "must declare sole mutable status authority");
requireText("docs/product/PRODUCT_FORECAST.md", /Current-status authority:\*\* \[NEXT_STEPS\.md\]/, "forecast must route live status to NEXT_STEPS");
requireText("docs/product/PRODUCT_OWNER_BRIEF.md", /Live delivery status:\*\* \[NEXT_STEPS\.md\]/, "PO brief must route live status to NEXT_STEPS");
requireText("docs/README.md", /DOC_GOVERNANCE\.md/, "catalog must link documentation governance");
requireText("docs/README.md", /DEVELOPER_WORKFLOW\.md/, "catalog must link developer workflow");
requireText("docs/README.md", /PROOF_ROUTER\.md/, "catalog must link proof router");

const liveDocs = [
  "docs/product/COMMAND_DOCTRINE.md",
  "docs/product/PRODUCT_FORECAST.md",
  "docs/product/PRODUCT_OWNER_BRIEF.md",
  "docs/product/SOLUTION_REQUIREMENTS.md",
];
forbidAcross(liveDocs, /PDP\s*\(NOW\)|PDP React migration[^\n|]*\|\s*\*\*NOW\*\*|Home still waits PO|Do not start Home|Book Step 2 or PLP|PLP landed → PDP \(NOW\)/i, "contains superseded delivery status; use NEXT_STEPS");

const docs = [];
const stack = [path.join(ROOT, "docs")];
while (stack.length) {
  const current = stack.pop();
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) stack.push(full);
    else if (entry.name.endsWith(".md")) docs.push(path.relative(ROOT, full));
  }
}
forbidAcross(docs, /Nazi QA/i, "use 'strict interface audit' terminology");

if (failures.length) {
  console.error(`[check-doc-governance] FAIL: ${failures.length} governance violation(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`[check-doc-governance] OK: authority routes, stale-status guard, entry routes, and terminology`);
