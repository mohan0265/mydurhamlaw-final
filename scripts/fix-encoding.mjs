// scripts/fix-encoding.mjs
// Usage:
//   node scripts/fix-encoding.mjs
//   node scripts/fix-encoding.mjs src ".ts,.tsx,.js"   // optional custom root/exts

import fs from "fs";
import path from "path";

const ROOT = process.argv[2] || "src";
const EXT_LIST = (process.argv[3] || ".ts,.tsx").split(",").map((s) => s.trim());

const BAD = [
  { re: /^\uFEFF/, rep: "" },                         // leading BOM
  { re: /\uFEFF/g, rep: "" },                         // BOM inside
  { re: /\u00A0/g, rep: " " },                        // NBSP -> space
  { re: /[\u200B\u200C\u200D]/g, rep: "" },           // zero-width chars
  { re: /[\u2018\u2019]/g, rep: "'" },                // smart single quotes
  { re: /[\u201C\u201D]/g, rep: '"' },                // smart double quotes
  { re: /[\u2013\u2014]/g, rep: "-" },                // en/em dash -> hyphen
];

function isWanted(file) {
  return EXT_LIST.some((ext) => file.toLowerCase().endsWith(ext));
}

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (isWanted(p)) yield p;
  }
}

function cleanText(text) {
  let out = text;
  for (const { re, rep } of BAD) out = out.replace(re, rep);
  return out;
}

function cleanFile(file) {
  let buf = fs.readFileSync(file);
  // Strip UTF-8 BOM bytes if present
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3);
  }
  const before = buf.toString("utf8");
  const after = cleanText(before);
  if (after !== before) {
    fs.writeFileSync(file, Buffer.from(after, "utf8")); // writes UTF-8 (no BOM)
    return true;
  }
  return false;
}

function main() {
  const start = Date.now();
  if (!fs.existsSync(ROOT)) {
    console.error(`Root directory "${ROOT}" not found from ${process.cwd()}`);
    process.exit(1);
  }
  let total = 0, changed = 0;
  for (const file of walk(ROOT)) {
    total++;
    if (cleanFile(file)) {
      changed++;
      console.log(`Cleaned: ${file}`);
    }
  }
  console.log(`\nNormalized ${total} file(s). Changed ${changed}. UTF-8 (no BOM) + Unicode cleaned in ${Date.now() - start}ms.`);
}

main();
