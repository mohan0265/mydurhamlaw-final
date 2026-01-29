import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const EXTENSIONS = [".tsx", ".ts", ".js", ".jsx", ".md", ".json", ".css"];
const ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"];

let brokenRefs = [];
let legacyRefs = [];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

function checkAsset(filePath, assetPath) {
  // Normalize path
  let cleanPath = assetPath.trim();
  // Remove query params
  cleanPath = cleanPath.split("?")[0];
  // Remove anchor
  cleanPath = cleanPath.split("#")[0];

  if (!cleanPath) return;

  // Check if it's a legacy asset
  if (
    cleanPath.toLowerCase().includes("mydurhamlaw") ||
    cleanPath.includes("demo-frames")
  ) {
    legacyRefs.push({ file: filePath, asset: cleanPath });
  }

  // Check existence
  if (cleanPath.startsWith("/")) {
    const fullPath = path.join(PUBLIC_DIR, cleanPath);
    if (!fs.existsSync(fullPath)) {
      brokenRefs.push({ file: filePath, asset: cleanPath });
    }
  }
}

function auditFile(filePath) {
  if (!EXTENSIONS.includes(path.extname(filePath))) return;

  const content = fs.readFileSync(filePath, "utf8");

  // Regex patterns
  const patterns = [
    /src=['"]([^'"]+)['"]/g,
    /href=['"]([^'"]+)['"]/g,
    /url\(['"]?([^'"\)]+)['"]?\)/g,
    /from\s+['"]([^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
  ];

  patterns.forEach((regex) => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const ref = match[1];
      if (ASSET_EXTENSIONS.some((ext) => ref.toLowerCase().endsWith(ext))) {
        checkAsset(path.relative(ROOT_DIR, filePath), ref);
      }
    }
  });
}

console.log("Starting Asset Audit...");

const allSrcFiles = getAllFiles(SRC_DIR);
allSrcFiles.forEach(auditFile);

// Also check public for unused, but that's harder. Let's stick to broken refs properly.

console.log("\n--- BROKEN REFERENCES ---");
if (brokenRefs.length === 0) {
  console.log("No broken asset references found.");
} else {
  brokenRefs.forEach((item) => {
    console.log(`[BROKEN] ${item.file}: ${item.asset}`);
  });
}

console.log("\n--- LEGACY ASSET REFERENCES ---");
if (legacyRefs.length === 0) {
  console.log("No legacy asset references found in import/src strings.");
} else {
  legacyRefs.forEach((item) => {
    console.log(`[LEGACY] ${item.file}: ${item.asset}`);
  });
}

if (brokenRefs.length > 0) process.exit(1);
