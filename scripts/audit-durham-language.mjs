import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");

const DIRS_TO_SCAN = [
  path.join(SRC_DIR, "pages"),
  path.join(SRC_DIR, "components"),
  path.join(SRC_DIR, "content"),
];

const IGNORE_DIRS = ["node_modules", ".next", ".git"];

const EXTENSIONS = [".tsx", ".ts", ".md", ".mdx"];

// Regex to find H1-H3 headings containing "Durham"
// Matches: <h[1-3]...>...Durham...</h[1-3]> OR # Durham... (markdown)
// We need to be careful with regex in HTML/JSX.
// Simple check: line contains (<h1|<h2|<h3) AND "Durham"
// OR line starts with (# |## |### ) AND contains "Durham"

let violations = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Check for "Durham" usage
    if (!trimmed.includes("Durham")) return;

    // EXCEPTIONS (Allowed patterns)
    if (trimmed.includes("Journey")) return;
    if (trimmed.includes("journey")) return;
    if (trimmed.includes("affiliated")) return;
    if (trimmed.includes("endorsed")) return;
    if (trimmed.includes("MyDurhamLaw")) return; // Product name is allowed
    if (trimmed.includes("meta")) return; // Allow in meta tags
    if (trimmed.includes("title>")) return; // Allow in <title>
    if (trimmed.includes('description"')) return; // Allow in meta description
    if (trimmed.includes("canonical")) return; // Allow in canonical
    if (trimmed.includes("keywords")) return; // Allow in keywords
    if (trimmed.includes("og:")) return; // Allow in open graph
    if (trimmed.includes("twitter:")) return; // Allow in twitter cards
    if (trimmed.toLowerCase().includes("audience anchor")) return; // Explicitly labeled anchor

    // CHECK HEADINGS
    const isJsxHeading = /<h[1-3]/.test(trimmed);
    const isMdHeading = /^#{1,3}\s/.test(trimmed);

    if (isJsxHeading || isMdHeading) {
      // Double check it's not a false positive like "Durham Law Journey" (already handled by exceptions, but being safe)
      console.error(`\n[VIOLATION] ${filePath}:${lineNum}`);
      console.error(`   "${trimmed}"`);
      console.error(
        `   -> RULE: Do not use "Durham" in H1-H3 headings unless it refers to "Journey" or is a disclaimer.`,
      );
      violations++;
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    if (IGNORE_DIRS.includes(file)) return;

    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        scanFile(fullPath);
      }
    }
  });
}

console.log("🔍 Starting Durham Naming & SEO Safety Audit...");
console.log('   Rule: No "Durham" in H1-H3 (except "Journey" or Disclaimers).');

DIRS_TO_SCAN.forEach((dir) => walkDir(dir));

if (violations > 0) {
  console.error(`\n❌ Audit FAILED. Found ${violations} violations.`);
  process.exit(1);
} else {
  console.log("\n✅ Audit PASSED. No naming violations found.");
  process.exit(0);
}
