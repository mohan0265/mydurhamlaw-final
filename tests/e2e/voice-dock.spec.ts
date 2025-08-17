import { test, expect } from '@playwright/test';

test.describe('Durmah Voice Dock', () => {
  test('should open, listen, and close via keyboard shortcuts', async ({ page }) => {
    await page.goto('/');

    // Open from the floating widget (match the visible Durmah button)
    await page.getByRole('button', { name: /Durmah/i }).click();

    // Header can be "Durmah Voice" or "Durmah — Voice Mode"
    await expect(page.getByText(/Durmah\s*(—|-)?\s*Voice( Mode)?/i)).toBeVisible();

    // Start listening with space (your dock listens to space/m)
    await page.keyboard.press(' ');
    // Give it a beat to toggle state
    await page.waitForTimeout(300);

    // Close with Esc
    await page.keyboard.press('Escape');

    // Confirm it closed
    await expect(page.getByText(/Durmah\s*(—|-)?\s*Voice( Mode)?/i)).toBeHidden({ timeout: 2000 });
  });
});
