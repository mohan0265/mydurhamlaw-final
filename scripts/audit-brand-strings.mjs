import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const FORBIDDEN_STRINGS = [
  "DurhamLawPriya",
  "MyDurhamLawPriya",
  "DurmahLawPriya",
  "mydurhamlawpriya",
  "durhamlawpriya",
  "MyDurhamLaw", // re-asserting to be safe
  "mydurhamlaw",
];
const EXCLUDED_DIRS = [
  "docs",
  "node_modules",
  ".next",
  ".git",
  ".vscode",
  "coverage",
  "dist",
  "build",
  ".config",
  ".netlify",
  ".claude",
];
const EXCLUDED_FILES = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "task.md",
  "implementation_plan.md",
  "audit-brand-strings.mjs",
  "brand-guard.mjs",
  "audit-public-assets.mjs",
  "audit-durham-language.mjs",
  "capture-demos.mjs",
  "_redirects",
  "build_log.txt",
  "build_log_v2.txt",
  "audit_report.txt",
];

let foundErrors = false;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    // Directory might be inaccessible
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry);

    // Skip if in excluded dirs (check entry name directly for robustness)
    if (EXCLUDED_DIRS.includes(entry)) {
      continue;
    }

    // Also check full path for nested exclusions if needed (optional, but above covers top-level ignores)
    // Keep original logic for safety if needed, but the simple check above handles recursion blocking.
    if (
      EXCLUDED_DIRS.some(
        (excluded) =>
          entryPath.includes(path.sep + excluded + path.sep) ||
          entryPath.endsWith(path.sep + excluded),
      )
    ) {
      continue;
    }

    let stats;
    try {
      if (!fs.existsSync(entryPath)) continue;
      stats = fs.statSync(entryPath);
    } catch (e) {
      // Skip files that can't be stat-ed
      continue;
    }

    if (stats.isDirectory()) {
      scanDirectory(entryPath);
    } else {
      if (
        !EXCLUDED_FILES.includes(entry) &&
        !entry.endsWith(".png") &&
        !entry.endsWith(".jpg") &&
        !entry.endsWith(".ico") &&
        !entry.endsWith(".svg") &&
        !entry.endsWith(".docx") &&
        !entry.endsWith(".pdf") &&
        !entry.endsWith(".pack") &&
        !entry.endsWith(".idx") &&
        !entry.endsWith(".map") &&
        !entry.endsWith(".old")
      ) {
        checkFile(entryPath);
      }
    }
  }
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check line by line for better reporting
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      for (const forbidden of FORBIDDEN_STRINGS) {
        if (line.includes(forbidden)) {
          // Ignore imports of legacy components if we are just renaming visible text,
          // but goal is full rebrand. Let's flag everything.
          // Exception: if it's in a comment that says "Legacy" maybe?
          // For now, strict check.

          // Exclude this script itself if somehow checked (already excluded by filename but just in case)
          if (filePath.includes("audit-brand-strings.mjs")) return;

          console.error(
            `[FAIL] Found "${forbidden}" in ${path.relative(rootDir, filePath)}:${index + 1}`,
          );
          console.error(`       Line: ${line.trim().substring(0, 100)}...`);
          foundErrors = true;
        }
      }
    });
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
}

console.log("🔍 Starting Brand String Audit...");
console.log(`Checking for: ${FORBIDDEN_STRINGS.join(", ")}`);
console.log(`Excluding directories: ${EXCLUDED_DIRS.join(", ")}`);

scanDirectory(rootDir);

if (foundErrors) {
  console.error("\n❌ Audit FAILED. Found legacy brand strings.");
  process.exit(1);
} else {
  console.log("\n✅ Audit PASSED. No legacy brand strings found.");
  process.exit(0);
}
