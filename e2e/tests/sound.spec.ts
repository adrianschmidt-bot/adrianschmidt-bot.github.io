import { test, expect } from '@playwright/test';
import { selectors } from '../fixtures/selectors';

test.describe('Sound Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('sound toggle button is visible', async ({ page }) => {
    const soundToggle = page.locator(selectors.soundToggle);
    await expect(soundToggle).toBeVisible();
  });

  test('sound is enabled by default', async ({ page }) => {
    const soundToggle = page.locator(selectors.soundToggle);
    // When sound is enabled, aria-pressed is "true"
    await expect(soundToggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking toggle disables sound', async ({ page }) => {
    const soundToggle = page.locator(selectors.soundToggle);

    // Initially enabled
    await expect(soundToggle).toHaveAttribute('aria-pressed', 'true');

    // Click to toggle
    await soundToggle.click();

    // Should now be disabled - MDC removes aria-pressed or changes aria-label
    // Check by aria-label instead (more reliable for MDC toggle)
    await expect(soundToggle).toHaveAttribute('aria-label', 'Enable sound');
  });

  test('clicking toggle again re-enables sound', async ({ page }) => {
    const soundToggle = page.locator(selectors.soundToggle);

    // Disable
    await soundToggle.click();
    await expect(soundToggle).toHaveAttribute('aria-label', 'Enable sound');

    // Re-enable
    await soundToggle.click();
    await expect(soundToggle).toHaveAttribute('aria-label', 'Disable sound');
  });

  test('sound setting persists across page reload', async ({ page }) => {
    const soundToggle = page.locator(selectors.soundToggle);

    // Disable sound
    await soundToggle.click();
    await expect(soundToggle).toHaveAttribute('aria-label', 'Enable sound');

    // Reload the page
    await page.reload();

    // Sound should still be disabled
    await expect(soundToggle).toHaveAttribute('aria-label', 'Enable sound');
  });

  test('sound setting persists when re-enabled', async ({ page }) => {
    const soundToggle = page.locator(selectors.soundToggle);

    // Disable, then re-enable
    await soundToggle.click();
    await soundToggle.click();
    await expect(soundToggle).toHaveAttribute('aria-label', 'Disable sound');

    // Reload the page
    await page.reload();

    // Sound should still be enabled
    await expect(soundToggle).toHaveAttribute('aria-label', 'Disable sound');
  });
});

test.describe('Sound Alerts (visual indicators only)', () => {
  // Note: Actually testing audio playback is complex and unreliable
  // These tests verify the conditions under which sounds should play
  // This test is slow - needs to wait ~90 seconds for timer
  test.slow();

  test('feed timer warning visual at 30 seconds', async ({ page }) => {
    await page.goto('/');
    const feedTimer = page.locator(selectors.feedTimer);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for feed timer to reach 30 seconds (from 120s, so ~90 second wait)
    await expect(async () => {
      const timer = await feedTimer.textContent();
      expect(parseInt(timer!)).toBeLessThanOrEqual(30);
    }).toPass({ timeout: 95000 });

    // At 30 seconds and below, the timer container should have warning class
    const feedTimerContainer = feedTimer.locator('..');
    await expect(feedTimerContainer).toHaveClass(/warning/);
  });
});
