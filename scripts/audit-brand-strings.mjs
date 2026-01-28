import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const FORBIDDEN_STRINGS = ["MyDurhamLaw", "mydurhamlaw.com"];
const EXCLUDED_DIRS = [
  "docs",
  "node_modules",
  ".next",
  ".git",
  ".vscode",
  "coverage",
  "dist",
  "build",
  ".claude",
  ".config",
];
const EXCLUDED_FILES = [
  "audit-brand-strings.mjs",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
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

    // Skip if in excluded dirs
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
        !entry.endsWith(".svg")
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
