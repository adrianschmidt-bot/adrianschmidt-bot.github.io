import { test, expect } from '@playwright/test';
import { selectors, gameConfig } from '../fixtures/selectors';

test.describe('Timer Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('timers decrement each second when game is running', async ({ page }) => {
    const gameTimer = page.locator(selectors.gameTimer);
    const feedTimer = page.locator(selectors.feedTimer);

    // Get initial values
    const initialGameTime = gameConfig.easy.initialGameTimer;
    const initialFeedTime = gameConfig.easy.initialFeedTimer;

    await expect(gameTimer).toHaveText(String(initialGameTime));
    await expect(feedTimer).toHaveText(String(initialFeedTime));

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for game timer to decrement from initial value
    await expect(gameTimer).not.toHaveText(String(initialGameTime), { timeout: 3000 });
    await expect(feedTimer).not.toHaveText(String(initialFeedTime), { timeout: 3000 });

    // Timers should have decremented
    const newGameTime = await gameTimer.textContent();
    const newFeedTime = await feedTimer.textContent();

    expect(parseInt(newGameTime!)).toBeLessThan(initialGameTime);
    expect(parseInt(newFeedTime!)).toBeLessThan(initialFeedTime);
  });

  test('pausing stops timer decrement', async ({ page }) => {
    const gameTimer = page.locator(selectors.gameTimer);
    const initialGameTime = gameConfig.easy.initialGameTimer;

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for at least one tick
    await expect(gameTimer).not.toHaveText(String(initialGameTime), { timeout: 3000 });

    // Pause the game
    await page.locator(selectors.startPauseButton).click();

    // Record the timer value
    const timerValueWhenPaused = await gameTimer.textContent();

    // Verify timer stays the same (check twice with a gap to prove it's not changing)
    await expect(gameTimer).toHaveText(timerValueWhenPaused!, { timeout: 2000 });
    await new Promise(r => setTimeout(r, 1100));
    await expect(gameTimer).toHaveText(timerValueWhenPaused!);
  });

  test('resuming game continues timer from paused value', async ({ page }) => {
    const gameTimer = page.locator(selectors.gameTimer);
    const initialGameTime = gameConfig.easy.initialGameTimer;

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for at least one tick
    await expect(gameTimer).not.toHaveText(String(initialGameTime), { timeout: 3000 });

    // Pause the game
    await page.locator(selectors.startPauseButton).click();
    const timerValueWhenPaused = await gameTimer.textContent();

    // Resume the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for timer to decrement from paused value
    await expect(gameTimer).not.toHaveText(timerValueWhenPaused!, { timeout: 3000 });

    // Timer should have decremented from paused value
    const timerAfterResume = await gameTimer.textContent();
    expect(parseInt(timerAfterResume!)).toBeLessThan(parseInt(timerValueWhenPaused!));
  });

  test('Start button shows "Pause" when game is running', async ({ page }) => {
    const startPauseButton = page.locator(selectors.startPauseButton);

    // Initially shows "Start"
    await expect(startPauseButton).toHaveAttribute('label', 'Start');

    // Start the game
    await startPauseButton.click();

    // Should now show "Pause"
    await expect(startPauseButton).toHaveAttribute('label', 'Pause');
  });

  test('Pause button shows "Start" when game is paused', async ({ page }) => {
    const startPauseButton = page.locator(selectors.startPauseButton);

    // Start the game
    await startPauseButton.click();
    await expect(startPauseButton).toHaveAttribute('label', 'Pause');

    // Pause the game
    await startPauseButton.click();
    await expect(startPauseButton).toHaveAttribute('label', 'Start');
  });

  test('Reset button is disabled while game is running', async ({ page }) => {
    const resetButton = page.locator(selectors.resetButton);

    // Initially enabled
    await expect(resetButton).not.toHaveAttribute('disabled');

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Should be disabled
    await expect(resetButton).toHaveAttribute('disabled', '');
  });

  test('Reset button resets all values to initial state', async ({ page }) => {
    const gameTimer = page.locator(selectors.gameTimer);
    const feedTimer = page.locator(selectors.feedTimer);
    const successCounter = page.locator(selectors.successCounter);
    const initialGameTime = gameConfig.easy.initialGameTimer;

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Wait for timer to decrement a couple of seconds
    await expect(gameTimer).toHaveText(String(initialGameTime - 2), { timeout: 5000 });

    // Pause and reset
    await page.locator(selectors.startPauseButton).click();
    await page.locator(selectors.resetButton).click();

    // All values should be reset
    await expect(gameTimer).toHaveText(String(initialGameTime));
    await expect(feedTimer).toHaveText(String(gameConfig.easy.initialFeedTimer));
    await expect(successCounter).toHaveText(String(gameConfig.easy.goalNumberOfSuccesses));
  });
});
