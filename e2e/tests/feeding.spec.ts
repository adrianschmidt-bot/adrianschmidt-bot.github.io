import { test, expect } from '@playwright/test';
import { selectors, gameConfig, gameConstants } from '../fixtures/selectors';

test.describe('Feeding Mechanic', () => {
  // Most tests in this suite require waiting for timers to count down
  test.slow();

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('feed button is disabled when game is not running', async ({ page }) => {
    const feedButton = page.locator(selectors.feedButton);
    await expect(feedButton).toHaveAttribute('disabled', '');
  });

  test('feed button is disabled when feed timer > 30 seconds', async ({ page }) => {
    const feedButton = page.locator(selectors.feedButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Feed button should still be disabled (timer is at 120s)
    await expect(feedButton).toHaveAttribute('disabled', '');
  });

  test('feed button becomes enabled when feed timer <= 30 seconds', async ({ page }) => {
    const feedButton = page.locator(selectors.feedButton);
    const feedTimer = page.locator(selectors.feedTimer);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for the feed timer to reach 30 seconds (need to wait ~90 seconds)
    // For testing purposes, we'll use a polling approach
    await expect(async () => {
      const timerValue = await feedTimer.textContent();
      expect(parseInt(timerValue!)).toBeLessThanOrEqual(gameConstants.feedThreshold);
    }).toPass({ timeout: 95000 });

    // Feed button should now be enabled
    await expect(feedButton).not.toHaveAttribute('disabled');
  });

  test.describe('Feed timer reset behavior', () => {
    // Note: This test is slow as we need to wait for the timer to reach the feed threshold
    test.slow();

    test('feeding resets timer using formula: initialTimer - currentTimer', async ({ page }) => {
      const feedButton = page.locator(selectors.feedButton);
      const feedTimer = page.locator(selectors.feedTimer);

      // Start the game
      await page.locator(selectors.startPauseButton).click();

      // Wait for the feed timer to be within feedable range
      await expect(async () => {
        const timerValue = await feedTimer.textContent();
        expect(parseInt(timerValue!)).toBeLessThanOrEqual(gameConstants.feedThreshold);
      }).toPass({ timeout: 95000 });

      // Get the current timer value before feeding
      const timerBeforeFeed = parseInt((await feedTimer.textContent())!);

      // Feed the dragon
      await feedButton.click();

      // The new timer value should be: initialFeedTimer - timerBeforeFeed
      const expectedNewTimer = gameConfig.easy.initialFeedTimer - timerBeforeFeed;

      // Allow for 1 second variance due to timing
      const newTimer = parseInt((await feedTimer.textContent())!);
      expect(newTimer).toBeGreaterThanOrEqual(expectedNewTimer - 1);
      expect(newTimer).toBeLessThanOrEqual(expectedNewTimer + 1);
    });
  });

  test('feed button is disabled again after feeding (timer > 30)', async ({ page }) => {
    const feedButton = page.locator(selectors.feedButton);
    const feedTimer = page.locator(selectors.feedTimer);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for the feed timer to be within feedable range
    await expect(async () => {
      const timerValue = await feedTimer.textContent();
      expect(parseInt(timerValue!)).toBeLessThanOrEqual(gameConstants.feedThreshold);
    }).toPass({ timeout: 95000 });

    // Feed the dragon
    await feedButton.click();

    // Feed button should be disabled again (timer reset to > 30)
    await expect(feedButton).toHaveAttribute('disabled', '');
  });

  test('feed timer warning class applied when timer <= 30', async ({ page }) => {
    const feedTimer = page.locator(selectors.feedTimer);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for the feed timer to be within feedable range
    await expect(async () => {
      const timerValue = await feedTimer.textContent();
      expect(parseInt(timerValue!)).toBeLessThanOrEqual(gameConstants.feedThreshold);
    }).toPass({ timeout: 95000 });

    // The parent container should have 'warning' class
    const feedTimerContainer = feedTimer.locator('..');
    await expect(feedTimerContainer).toHaveClass(/warning/);
  });
});
