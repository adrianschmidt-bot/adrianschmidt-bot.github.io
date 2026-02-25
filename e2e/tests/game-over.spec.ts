import { test, expect } from '@playwright/test';
import { selectors, gameConfig } from '../fixtures/selectors';

test.describe('Game Over Conditions', () => {
  // Most tests in this suite require waiting for timers to expire (2+ minutes)
  test.slow();

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Losing - Feed Timer', () => {
    test.slow(); // This test waits for timer to expire

    test('game over when feed timer reaches 0', async ({ page }) => {
      const feedTimer = page.locator(selectors.feedTimer);
      const gameOverDialog = page.locator(selectors.gameOverDialog);
      const gameOverHeading = page.locator(selectors.gameOverHeading);
      const gameOverText = page.locator(selectors.gameOverText);

      // Start the game
      await page.locator(selectors.startPauseButton).click();

      // Wait for feed timer to reach 0 (2 minutes = 120 seconds)
      // Add buffer for test reliability
      await expect(async () => {
        const timer = await feedTimer.textContent();
        expect(parseInt(timer!)).toBeLessThanOrEqual(0);
      }).toPass({ timeout: 125000 });

      // Game over dialog should appear with lose message
      await expect(gameOverDialog).toBeVisible();
      await expect(gameOverHeading).toHaveText('Oh noes!');
      await expect(gameOverText).toContainText("didn't do so well");
    });
  });

  test('losing game shows 0 time points', async ({ page }) => {
    const logSuccessButton = page.locator(selectors.logSuccessButton);
    const feedTimer = page.locator(selectors.feedTimer);
    const gameOverDialog = page.locator(selectors.gameOverDialog);
    const timePoints = page.locator(selectors.timePoints);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for feed timer to reach 0
    await expect(async () => {
      const timer = await feedTimer.textContent();
      expect(parseInt(timer!)).toBeLessThanOrEqual(0);
    }).toPass({ timeout: 125000 });

    // Game over dialog should appear
    await expect(gameOverDialog).toBeVisible();

    // Time points should show 0 for losing
    await expect(timePoints).toContainText('0');
  });

  test('base points shown correctly on loss based on difficulty', async ({ page }) => {
    const feedTimer = page.locator(selectors.feedTimer);
    const gameOverDialog = page.locator(selectors.gameOverDialog);
    const basePoints = page.locator(selectors.basePoints);

    // Select Hard difficulty (8 base points)
    await page.locator(selectors.hardButton).click();

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for feed timer to reach 0
    await expect(async () => {
      const timer = await feedTimer.textContent();
      expect(parseInt(timer!)).toBeLessThanOrEqual(0);
    }).toPass({ timeout: 125000 });

    // Game over dialog should appear
    await expect(gameOverDialog).toBeVisible();

    // Base points should show 8 (Hard difficulty)
    await expect(basePoints).toContainText('8');
  });

  test('game over button resets the game', async ({ page }) => {
    const feedTimer = page.locator(selectors.feedTimer);
    const gameOverDialog = page.locator(selectors.gameOverDialog);
    const gameOverButton = page.locator(selectors.gameOverButton);
    const gameTimer = page.locator(selectors.gameTimer);
    const successCounter = page.locator(selectors.successCounter);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for feed timer to reach 0
    await expect(async () => {
      const timer = await feedTimer.textContent();
      expect(parseInt(timer!)).toBeLessThanOrEqual(0);
    }).toPass({ timeout: 125000 });

    // Game over dialog should appear
    await expect(gameOverDialog).toBeVisible();

    // Click game over button
    await gameOverButton.click();

    // Dialog should close
    await expect(gameOverDialog).not.toBeVisible();

    // Game should be reset
    await expect(gameTimer).toHaveText(String(gameConfig.easy.initialGameTimer));
    await expect(feedTimer).toHaveText(String(gameConfig.easy.initialFeedTimer));
    await expect(successCounter).toHaveText(String(gameConfig.easy.goalNumberOfSuccesses));
  });

  test('game over button shows "Try again!" for loss', async ({ page }) => {
    const feedTimer = page.locator(selectors.feedTimer);
    const gameOverDialog = page.locator(selectors.gameOverDialog);
    const gameOverButton = page.locator(selectors.gameOverButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for feed timer to reach 0
    await expect(async () => {
      const timer = await feedTimer.textContent();
      expect(parseInt(timer!)).toBeLessThanOrEqual(0);
    }).toPass({ timeout: 125000 });

    await expect(gameOverDialog).toBeVisible();
    await expect(gameOverButton).toHaveAttribute('label', 'Try again!');
  });

  test('game over button shows "Yay!" for win', async ({ page }) => {
    const logSuccessButton = page.locator(selectors.logSuccessButton);
    const gameOverDialog = page.locator(selectors.gameOverDialog);
    const gameOverButton = page.locator(selectors.gameOverButton);

    // Start the game and win quickly
    await page.locator(selectors.startPauseButton).click();
    await logSuccessButton.click();
    await logSuccessButton.click();
    await logSuccessButton.click();

    await expect(gameOverDialog).toBeVisible();
    await expect(gameOverButton).toHaveAttribute('label', 'Yay!');
  });
});
