import { test, expect } from '@playwright/test';
import { selectors, gameConstants } from '../fixtures/selectors';

test.describe('Clue System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('starts with initial number of clues', async ({ page }) => {
    const remainingClues = page.locator(selectors.remainingClues);
    await expect(remainingClues).toHaveText(String(gameConstants.initialClues));
  });

  test('clue buttons are disabled when game is not running', async ({ page }) => {
    const generalClueButton = page.locator(selectors.generalClueButton);
    const specificClueButton = page.locator(selectors.specificClueButton);

    await expect(generalClueButton).toHaveAttribute('disabled', '');
    await expect(specificClueButton).toHaveAttribute('disabled', '');
  });

  test('general clue button is enabled when game is running and has enough clues', async ({ page }) => {
    const generalClueButton = page.locator(selectors.generalClueButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // General clue costs 1, we have 3, should be enabled
    await expect(generalClueButton).not.toHaveAttribute('disabled');
  });

  test('specific clue button is enabled when game is running and has enough clues', async ({ page }) => {
    const specificClueButton = page.locator(selectors.specificClueButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Specific clue costs 2, we have 3, should be enabled
    await expect(specificClueButton).not.toHaveAttribute('disabled');
  });

  test('using general clue costs 1 clue', async ({ page }) => {
    const remainingClues = page.locator(selectors.remainingClues);
    const generalClueButton = page.locator(selectors.generalClueButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Use general clue
    await generalClueButton.click();

    // Should have 2 clues remaining
    await expect(remainingClues).toHaveText(String(gameConstants.initialClues - gameConstants.generalClueCost));
  });

  test('using specific clue costs 2 clues', async ({ page }) => {
    const remainingClues = page.locator(selectors.remainingClues);
    const specificClueButton = page.locator(selectors.specificClueButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Use specific clue
    await specificClueButton.click();

    // Should have 1 clue remaining
    await expect(remainingClues).toHaveText(String(gameConstants.initialClues - gameConstants.specificClueCost));
  });

  test('general clue button disabled when not enough clues (0 clues)', async ({ page }) => {
    const remainingClues = page.locator(selectors.remainingClues);
    const generalClueButton = page.locator(selectors.generalClueButton);
    const specificClueButton = page.locator(selectors.specificClueButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Use all clues: specific (2) + general (1) = 3
    await specificClueButton.click();
    await expect(remainingClues).toHaveText('1');

    await generalClueButton.click();
    await expect(remainingClues).toHaveText('0');

    // General clue button should now be disabled
    await expect(generalClueButton).toHaveAttribute('disabled', '');
  });

  test('specific clue button disabled when only 1 clue remains', async ({ page }) => {
    const remainingClues = page.locator(selectors.remainingClues);
    const generalClueButton = page.locator(selectors.generalClueButton);
    const specificClueButton = page.locator(selectors.specificClueButton);

    // Start the game
    await page.locator(selectors.startPauseButton).click();

    // Use specific clue (costs 2) to get to 1 remaining
    await specificClueButton.click();
    await expect(remainingClues).toHaveText('1');

    // Specific clue button should now be disabled (need 2 clues)
    await expect(specificClueButton).toHaveAttribute('disabled', '');

    // General clue button should still be enabled (need 1 clue)
    await expect(generalClueButton).not.toHaveAttribute('disabled');
  });

  test.describe('Clue regeneration', () => {
    test.slow(); // This test requires waiting for clue regeneration

    test('clues regenerate after 15-20 seconds', async ({ page }) => {
      const remainingClues = page.locator(selectors.remainingClues);
      const specificClueButton = page.locator(selectors.specificClueButton);
      const generalClueButton = page.locator(selectors.generalClueButton);

      // Start the game
      await page.locator(selectors.startPauseButton).click();

      // Use all clues
      await specificClueButton.click(); // -2, now 1
      await generalClueButton.click(); // -1, now 0

      await expect(remainingClues).toHaveText('0');

      // Wait for clue regeneration (15-20 seconds, plus buffer)
      // Clue should regenerate within 20 seconds, we'll wait up to 25 to be safe
      await expect(async () => {
        const clues = await remainingClues.textContent();
        expect(parseInt(clues!)).toBeGreaterThan(0);
      }).toPass({ timeout: 25000 });
    });
  });
});
