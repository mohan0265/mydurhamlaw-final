import { test, expect } from "@playwright/test";

test.describe("Demo Privacy Guardrails", () => {
  const demoRoutes = [
    "/demo/dashboard?demo=1",
    "/demo/lecture-to-notes?demo=1",
    "/demo/durmah?demo=1",
  ];

  const FORBIDDEN_STRINGS = [
    "Chandramohan",
    "savermed",
    "casewaylaw.ai/admin",
    "@casewaylaw.ai", // Real internal emails
    "my-personal-email@gmail.com",
  ];

  for (const route of demoRoutes) {
    test(`Route ${route} should not leak PII`, async ({ page }) => {
      await page.goto(route);

      // 1. Verify Demo Mode indicator is present
      await expect(page.locator("text=Demo Environment")).toBeVisible();
      await expect(page.locator("text=Student")).toBeVisible();

      // 2. Scan entire page text for forbidden strings
      const content = await page.content();

      for (const str of FORBIDDEN_STRINGS) {
        if (content.toLowerCase().includes(str.toLowerCase())) {
          console.error(`FORBIDDEN STRING FOUND: "${str}" on ${route}`);
        }
        expect(content.toLowerCase()).not.toContain(str.toLowerCase());
      }

      // 3. Verify no auth redirect happened (url remains on demo)
      expect(page.url()).toContain("/demo/");
    });
  }
});
