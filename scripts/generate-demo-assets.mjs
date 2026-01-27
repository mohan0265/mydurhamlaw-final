import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const VIEWPORT = { width: 1280, height: 800 };

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureSafe(page, name, fn) {
  try {
    console.log(`Capturing ${name}...`);
    const outDir = `public/demo-frames/${name}`;
    await ensureDir(outDir);
    await fn(page, outDir);
    console.log(`Completed ${name}`);
  } catch (err) {
    console.error(`Failed to capture ${name}:`, err);
  }
}

async function captureYAAG(page, outDir) {
  await page.goto(`${BASE_URL}/year-at-a-glance`, {
    waitUntil: "domcontentloaded",
  });
  await new Promise((r) => setTimeout(r, 2000)); // Wait for render
  await page.setViewport(VIEWPORT);

  await page.screenshot({ path: `${outDir}/01.png` });

  // Try to click a term if we can find text
  // We'll just take a few scrolling shots as simulated interaction
  await page.evaluate(() => window.scrollBy(0, 300));
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${outDir}/02.png` });
}

async function captureDurmah(page, outDir) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `${outDir}/01.png` });
  // We won't try complex interaction blindly, just the base state
  // ideally we'd click the launcher
}

async function captureAssignments(page, outDir) {
  await page.goto(`${BASE_URL}/assignments`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `${outDir}/01.png` });
}

async function captureLectures(page, outDir) {
  await page.goto(`${BASE_URL}/study/lectures`, {
    waitUntil: "domcontentloaded",
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `${outDir}/01.png` });
}

async function captureExamPrep(page, outDir) {
  // Try /exam-prep or /study/exam-prep based on file list, likely /exam-prep
  await page.goto(`${BASE_URL}/exam-prep`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `${outDir}/01.png` });
}

async function captureQuiz(page, outDir) {
  await page.goto(`${BASE_URL}/quiz`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `${outDir}/01.png` });
}

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  try {
    await captureSafe(page, "yaag", captureYAAG);
    await captureSafe(page, "durmah_voice", captureDurmah);
    await captureSafe(page, "assignments", captureAssignments);
    await captureSafe(page, "lectures", captureLectures);
    await captureSafe(page, "exam_prep", captureExamPrep);
    await captureSafe(page, "quiz_me", captureQuiz);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
