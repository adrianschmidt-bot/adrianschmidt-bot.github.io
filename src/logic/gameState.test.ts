import { describe, it, expect, vi } from 'vitest';
import {
  createInitialState,
  isFeedingAllowed,
  isGeneralClueAllowed,
  isSpecificClueAllowed,
  calculateFeedReset,
  generateClueTimer,
  calculateTimePoints,
  FEED_THRESHOLD,
  GENERAL_CLUE_COST,
  SPECIFIC_CLUE_COST,
  INITIAL_CLUES,
  CLUE_REGEN_MIN,
  CLUE_REGEN_MAX,
  WON,
  LOST,
  GameState,
} from './gameState';
import { EASY, MEDIUM, HARD } from './difficulty';

describe('gameState constants', () => {
  it('should have correct feed threshold', () => {
    expect(FEED_THRESHOLD).toBe(30);
  });

  it('should have correct clue costs', () => {
    expect(GENERAL_CLUE_COST).toBe(1);
    expect(SPECIFIC_CLUE_COST).toBe(2);
  });

  it('should have correct initial clues', () => {
    expect(INITIAL_CLUES).toBe(3);
  });

  it('should have correct clue regeneration range', () => {
    expect(CLUE_REGEN_MIN).toBe(15);
    expect(CLUE_REGEN_MAX).toBe(20);
  });
});

describe('game result constants', () => {
  it('WON should have correct properties', () => {
    expect(WON.won).toBe(true);
    expect(WON.heading).toBe('You Won!');
    expect(WON.buttonLabel).toBe('Yay!');
  });

  it('LOST should have correct properties', () => {
    expect(LOST.won).toBe(false);
    expect(LOST.heading).toBe('Oh noes!');
    expect(LOST.buttonLabel).toBe('Try again!');
  });
});

describe('createInitialState', () => {
  it('should create initial state with EASY difficulty by default', () => {
    const state = createInitialState();

    expect(state.isRunning).toBe(false);
    expect(state.difficulty).toBe(EASY);
    expect(state.gameTimer).toBe(EASY.initialGameTimer);
    expect(state.feedTimer).toBe(EASY.initialFeedTimer);
    expect(state.clueTimer).toBe(0);
    expect(state.successesUntilVictory).toBe(EASY.goalNumberOfSuccesses);
    expect(state.remainingClues).toBe(INITIAL_CLUES);
    expect(state.gameResult).toBeNull();
  });

  it('should create initial state with MEDIUM difficulty', () => {
    const state = createInitialState(MEDIUM);

    expect(state.difficulty).toBe(MEDIUM);
    expect(state.gameTimer).toBe(MEDIUM.initialGameTimer);
    expect(state.feedTimer).toBe(MEDIUM.initialFeedTimer);
    expect(state.successesUntilVictory).toBe(MEDIUM.goalNumberOfSuccesses);
  });

  it('should create initial state with HARD difficulty', () => {
    const state = createInitialState(HARD);

    expect(state.difficulty).toBe(HARD);
    expect(state.gameTimer).toBe(HARD.initialGameTimer);
    expect(state.feedTimer).toBe(HARD.initialFeedTimer);
    expect(state.successesUntilVictory).toBe(HARD.goalNumberOfSuccesses);
  });
});

describe('isFeedingAllowed', () => {
  const createStateWithFeedTimer = (feedTimer: number, isRunning = true): GameState => ({
    ...createInitialState(),
    isRunning,
    feedTimer,
  });

  it('should return false when game is not running', () => {
    const state = createStateWithFeedTimer(20, false);
    expect(isFeedingAllowed(state)).toBe(false);
  });

  it('should return false when feed timer is above threshold', () => {
    const state = createStateWithFeedTimer(31);
    expect(isFeedingAllowed(state)).toBe(false);
  });

  it('should return true when feed timer equals threshold', () => {
    const state = createStateWithFeedTimer(30);
    expect(isFeedingAllowed(state)).toBe(true);
  });

  it('should return true when feed timer is below threshold', () => {
    const state = createStateWithFeedTimer(29);
    expect(isFeedingAllowed(state)).toBe(true);
  });

  it('should return true when feed timer is at 1 second', () => {
    const state = createStateWithFeedTimer(1);
    expect(isFeedingAllowed(state)).toBe(true);
  });
});

describe('isGeneralClueAllowed', () => {
  const createStateWithClues = (remainingClues: number, isRunning = true): GameState => ({
    ...createInitialState(),
    isRunning,
    remainingClues,
  });

  it('should return false when game is not running', () => {
    const state = createStateWithClues(3, false);
    expect(isGeneralClueAllowed(state)).toBe(false);
  });

  it('should return false when not enough clues', () => {
    const state = createStateWithClues(0);
    expect(isGeneralClueAllowed(state)).toBe(false);
  });

  it('should return true when exactly enough clues', () => {
    const state = createStateWithClues(GENERAL_CLUE_COST);
    expect(isGeneralClueAllowed(state)).toBe(true);
  });

  it('should return true when more than enough clues', () => {
    const state = createStateWithClues(5);
    expect(isGeneralClueAllowed(state)).toBe(true);
  });
});

describe('isSpecificClueAllowed', () => {
  const createStateWithClues = (remainingClues: number, isRunning = true): GameState => ({
    ...createInitialState(),
    isRunning,
    remainingClues,
  });

  it('should return false when game is not running', () => {
    const state = createStateWithClues(3, false);
    expect(isSpecificClueAllowed(state)).toBe(false);
  });

  it('should return false when not enough clues', () => {
    const state = createStateWithClues(1);
    expect(isSpecificClueAllowed(state)).toBe(false);
  });

  it('should return true when exactly enough clues', () => {
    const state = createStateWithClues(SPECIFIC_CLUE_COST);
    expect(isSpecificClueAllowed(state)).toBe(true);
  });

  it('should return true when more than enough clues', () => {
    const state = createStateWithClues(5);
    expect(isSpecificClueAllowed(state)).toBe(true);
  });
});

describe('calculateFeedReset', () => {
  it('should calculate feed reset correctly when timer is at threshold', () => {
    // When currentTimer is 30 and initialTimer is 120, new timer should be 90
    expect(calculateFeedReset(120, 30)).toBe(90);
  });

  it('should calculate feed reset correctly when timer is low', () => {
    // When currentTimer is 10 and initialTimer is 120, new timer should be 110
    expect(calculateFeedReset(120, 10)).toBe(110);
  });

  it('should return 0 when current timer equals initial timer', () => {
    expect(calculateFeedReset(120, 120)).toBe(0);
  });

  it('should handle edge case of 1 second remaining', () => {
    expect(calculateFeedReset(120, 1)).toBe(119);
  });
});

describe('generateClueTimer', () => {
  it('should generate values within expected range', () => {
    // Run multiple times to test randomness
    for (let i = 0; i < 100; i++) {
      const result = generateClueTimer();
      expect(result).toBeGreaterThanOrEqual(CLUE_REGEN_MIN);
      expect(result).toBeLessThanOrEqual(CLUE_REGEN_MAX);
    }
  });

  it('should return an integer', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateClueTimer();
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('should return minimum value when random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(generateClueTimer()).toBe(CLUE_REGEN_MIN);
    vi.restoreAllMocks();
  });

  it('should return maximum value when random returns ~1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(generateClueTimer()).toBe(CLUE_REGEN_MAX);
    vi.restoreAllMocks();
  });
});

describe('calculateTimePoints', () => {
  it('should return 0 for 0 seconds', () => {
    expect(calculateTimePoints(0)).toBe(0);
  });

  it('should return 0 for 9 seconds', () => {
    expect(calculateTimePoints(9)).toBe(0);
  });

  it('should return 1 for 10 seconds', () => {
    expect(calculateTimePoints(10)).toBe(1);
  });

  it('should return 1 for 19 seconds', () => {
    expect(calculateTimePoints(19)).toBe(1);
  });

  it('should return 30 for 300 seconds (5 minutes)', () => {
    expect(calculateTimePoints(300)).toBe(30);
  });

  it('should return 42 for 420 seconds (7 minutes)', () => {
    expect(calculateTimePoints(420)).toBe(42);
  });

  it('should floor fractional values', () => {
    expect(calculateTimePoints(35)).toBe(3);
    expect(calculateTimePoints(99)).toBe(9);
  });
});
