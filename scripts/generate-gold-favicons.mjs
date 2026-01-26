import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const SRC = 'public/brand/logo-icon-gold.svg';
const OUT_DIR = 'public';

async function generate() {
  console.log('Generating GOLD brand assets...');
  
  const buffer = await fs.readFile(SRC);

  // Favicons (Prefixed with gold-)
  await sharp(buffer).resize(16, 16).toFile(path.join(OUT_DIR, 'gold-favicon-16x16.png'));
  await sharp(buffer).resize(32, 32).toFile(path.join(OUT_DIR, 'gold-favicon-32x32.png'));
  await sharp(buffer).resize(48, 48).toFile(path.join(OUT_DIR, 'gold-favicon-48x48.png'));
  
  // Apple Touch Icon
  await sharp(buffer).resize(180, 180).toFile(path.join(OUT_DIR, 'gold-apple-touch-icon.png'));

  // Android Chrome
  await sharp(buffer).resize(192, 192).toFile(path.join(OUT_DIR, 'gold-android-chrome-192x192.png'));
  await sharp(buffer).resize(512, 512).toFile(path.join(OUT_DIR, 'gold-android-chrome-512x512.png'));

  // ICO
  try {
      await fs.copyFile(path.join(OUT_DIR, 'gold-favicon-32x32.png'), path.join(OUT_DIR, 'gold-favicon.ico'));
      console.log('Created gold-favicon.ico');
  } catch (e) {
      console.error('Error creating gold-favicon.ico', e);
  }
  
  console.log('Gold assets generated successfully!');
}

generate().catch(console.error);
