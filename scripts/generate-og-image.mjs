import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

async function generateOG() {
  console.log("Generating OG Image...");

  // Create white background 1200x630
  const width = 1200;
  const height = 630;

  // Load Brand Icon (Gold Gradient)
  const iconBuffer = await fs.readFile("public/brand/logo-icon-header.svg");

  // Create SVG for text (Purple Wordmark + Slogan)
  // Text centered
  // Wordmark: Caseway (Purple #5B2AAE) approx 80px font
  // Slogan: Learn law | Write law | Speak law (Gray/Black) approx 40px font

  const textSvg = `
  <svg width="${width}" height="${height}">
    <style>
      .title { fill: #5B2AAE; font-family: sans-serif; font-weight: bold; font-size: 80px; }
      .slogan { fill: #1F2937; font-family: sans-serif; font-weight: normal; font-size: 32px; letter-spacing: 2px; }
    </style>
    <text x="50%" y="420" text-anchor="middle" class="title">CASEWAY</text>
    <text x="50%" y="490" text-anchor="middle" class="slogan">LEARN LAW | WRITE LAW | SPEAK LAW</text>
  </svg>
  `;

  // Composite
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: iconBuffer,
        top: 120,
        left: (width - 200) / 2,
        resize: { width: 200, height: 200 },
      }, // Icon centered top
      { input: Buffer.from(textSvg), top: 0, left: 0 },
    ])
    .toFile("public/og/og-default.png");

  console.log("OG Image generated at public/og/og-default.png");
}

generateOG().catch(console.error);
