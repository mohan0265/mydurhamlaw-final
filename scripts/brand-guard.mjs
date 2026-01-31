import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");

const FORBIDDEN_TERMS = [
  "DurhamLawPriya",
  "MyDurhamLawPriya",
  "DurmahLawPriya",
  "mydurhamlawpriya",
  "durhamlawpriya",
  "MyDurhamLaw",
  "mydurhamlaw",
];
const EXTENSIONS = [".tsx", ".ts", ".js", ".jsx", ".md", ".json"];
const EXCLUDE_DIRS = ["node_modules", ".next", ".git"];

let violations = [];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (EXCLUDE_DIRS.includes(file)) return;
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function checkFile(filePath) {
  if (!EXTENSIONS.includes(path.extname(filePath))) return;
  const content = fs.readFileSync(filePath, "utf8");

  FORBIDDEN_TERMS.forEach((term) => {
    if (content.includes(term)) {
      // Allow it if it's in a specific migration or historical doc context?
      // For now, strict.
      violations.push({ file: path.relative(ROOT_DIR, filePath), term });
    }
  });
}

console.log("Starting Brand Guard...");
const files = getAllFiles(SRC_DIR);
files.forEach(checkFile);

if (violations.length > 0) {
  console.error("\n❌ BRAND VIOLATIONS FOUND:");
  violations.forEach((v) => {
    console.error(`[${v.term}] in ${v.file}`);
  });
  console.error(
    `\nFound ${violations.length} violations. Please replace with "Caseway" or remove.`,
  );
  process.exit(1);
} else {
  console.log("✅ Brand Guard Passed. No legacy terms found.");
}
