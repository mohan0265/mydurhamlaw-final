import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DEMO_ROOT = path.join(ROOT_DIR, "public", "demos");
const THUMB_ROOT = path.join(ROOT_DIR, "public", "images", "demo-thumbnails");

const mappings = {
  assignments: "assignments.png",
  "durmah-voice": "durmah-voice.png",
  "exam-prep": "exam-prep.png",
  lectures: "assignments.png", // Fallback
  "quiz-me": "quiz-me.png",
  yaag: "assignments.png", // Fallback
};

console.log("Populating Demo Assets...");

for (const [folder, sourceFile] of Object.entries(mappings)) {
  const targetDir = path.join(DEMO_ROOT, folder);
  const sourcePath = path.join(THUMB_ROOT, sourceFile);

  if (!fs.existsSync(targetDir)) {
    console.warn(`Target directory not found: ${folder}`);
    continue;
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source image not found: ${sourceFile}`);
    continue;
  }

  // Find all step-*.png files in the target directory
  const files = fs
    .readdirSync(targetDir)
    .filter((f) => f.startsWith("step-") && f.endsWith(".png"));

  if (files.length === 0) {
    console.log(
      `No step-*.png files found in ${folder}, creating defaults (1-3)...`,
    );
    // If empty, create standard 1-3
    ["step-01.png", "step-02.png", "step-03.png"].forEach((step) => {
      fs.copyFileSync(sourcePath, path.join(targetDir, step));
      console.log(`  Created ${step}`);
    });
  } else {
    // Overwrite existing
    files.forEach((file) => {
      fs.copyFileSync(sourcePath, path.join(targetDir, file));
      console.log(`  Updated ${folder}/${file}`);
    });
  }
}

console.log("✅ Demo assets populated.");
