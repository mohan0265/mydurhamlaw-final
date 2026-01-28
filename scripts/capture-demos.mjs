import { chromium } from "@playwright/test";
import { DEMO_PLANS } from "./demoCapturePlan.mjs";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.DEMO_BASE_URL || "http://localhost:3000";
const VIEWPORT = { width: 1440, height: 900 };

async function dismissOverlays(page) {
  // Add logic here to dismiss cookie banners or other overlays
  // Example: await page.click('#cookie-accept', { timeout: 1000 }).catch(() => {});
  // For now, MyDurhamLaw public pages are clean, but we might wait a bit on load.
}

async function run() {
  console.log(`🎥 Starting Demo Capture against ${BASE_URL}`);
  console.log(`📋 Found ${DEMO_PLANS.length} plans.`);

  const browser = await chromium.launch();

  for (const plan of DEMO_PLANS) {
    console.log(`\n▶️  Capturing [${plan.id}] (${plan.slug})`);
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    // Navigate
    const url = `${BASE_URL}${plan.path}`;
    console.log(`   Navigating to ${url}...`);
    await page.goto(url);

    await dismissOverlays(page);

    // Ensure output dir exists
    const outDir = path.join(process.cwd(), "public", "demos", plan.slug);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Execute Steps
    for (const step of plan.steps) {
      console.log(`   📸 Step: ${step.name}`);

      for (const action of step.actions) {
        try {
          if (action.type === "click" && action.selector) {
            await page.waitForSelector(action.selector, { timeout: 5000 });
            await page.click(action.selector);
          } else if (
            action.type === "type" &&
            action.selector &&
            action.value
          ) {
            await page.waitForSelector(action.selector);
            await page.type(action.selector, action.value, { delay: 50 });
          } else if (action.type === "wait" && action.ms) {
            await page.waitForTimeout(action.ms);
          } else if (action.type === "waitForSelector" && action.selector) {
            await page.waitForSelector(action.selector);
          } else if (action.type === "waitForLoadState" && action.state) {
            await page.waitForLoadState(action.state);
          }
        } catch (err) {
          console.error(
            `      ❌ Action failed: ${JSON.stringify(action)} - ${err.message}`,
          );
        }
      }

      // Capture
      const screenshotPath = path.join(outDir, step.screenshot);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`      Saved: ${step.screenshot}`);
    }

    await context.close();
  }

  await browser.close();
  console.log("\n✅ Demo Capture Complete.");
}

run().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
