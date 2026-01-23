const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourcePath = path.join(__dirname, '../public/assets/mascots/quiz-me-bunny.png');
const outputDir = path.join(__dirname, '../public/assets/mascots');

const sizes = [96, 160, 256];

async function optimizeMascot() {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source mascot not found at: ${sourcePath}`);
    return;
  }

  console.log(`Optimizing mascot from: ${sourcePath}`);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `quiz-me-bunny-${size}.webp`);
    try {
      await sharp(sourcePath)
        .resize(size)
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath);
      
      const statsOrig = fs.statSync(sourcePath);
      const statsNew = fs.statSync(outputPath);
      const reduction = (((statsOrig.size - statsNew.size) / statsOrig.size) * 100).toFixed(2);
      
      console.log(`Generated: ${path.basename(outputPath)} (${(statsNew.size / 1024).toFixed(2)} KB) - Reduced by ${reduction}%`);
    } catch (err) {
      console.error(`Error generating ${size}px WebP:`, err);
    }
  }
}

optimizeMascot();
