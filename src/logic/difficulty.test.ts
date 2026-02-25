import { describe, it, expect } from 'vitest';
import { EASY, MEDIUM, HARD, DIFFICULTIES, DifficultyConfig } from './difficulty';

describe('EASY difficulty', () => {
  it('should have correct name', () => {
    expect(EASY.name).toBe('easy');
  });

  it('should require 3 successes to win', () => {
    expect(EASY.goalNumberOfSuccesses).toBe(3);
  });

  it('should have 2 minute feed timer (120 seconds)', () => {
    expect(EASY.initialFeedTimer).toBe(120);
  });

  it('should have 5 minute game timer (300 seconds)', () => {
    expect(EASY.initialGameTimer).toBe(300);
  });

  it('should award 1 base point', () => {
    expect(EASY.points).toBe(1);
  });
});

describe('MEDIUM difficulty', () => {
  it('should have correct name', () => {
    expect(MEDIUM.name).toBe('medium');
  });

  it('should require 5 successes to win', () => {
    expect(MEDIUM.goalNumberOfSuccesses).toBe(5);
  });

  it('should have 2 minute feed timer (120 seconds)', () => {
    expect(MEDIUM.initialFeedTimer).toBe(120);
  });

  it('should have 6 minute game timer (360 seconds)', () => {
    expect(MEDIUM.initialGameTimer).toBe(360);
  });

  it('should award 3 base points', () => {
    expect(MEDIUM.points).toBe(3);
  });
});

describe('HARD difficulty', () => {
  it('should have correct name', () => {
    expect(HARD.name).toBe('hard');
  });

  it('should require 7 successes to win', () => {
    expect(HARD.goalNumberOfSuccesses).toBe(7);
  });

  it('should have 2 minute feed timer (120 seconds)', () => {
    expect(HARD.initialFeedTimer).toBe(120);
  });

  it('should have 7 minute game timer (420 seconds)', () => {
    expect(HARD.initialGameTimer).toBe(420);
  });

  it('should award 8 base points', () => {
    expect(HARD.points).toBe(8);
  });
});

describe('DIFFICULTIES array', () => {
  it('should contain all three difficulties', () => {
    expect(DIFFICULTIES).toHaveLength(3);
  });

  it('should contain EASY, MEDIUM, and HARD in order', () => {
    expect(DIFFICULTIES[0]).toBe(EASY);
    expect(DIFFICULTIES[1]).toBe(MEDIUM);
    expect(DIFFICULTIES[2]).toBe(HARD);
  });

  it('should be readonly', () => {
    // TypeScript ensures this at compile time, but we can verify
    // that the array contains the expected items
    const [easy, medium, hard] = DIFFICULTIES;
    expect(easy.name).toBe('easy');
    expect(medium.name).toBe('medium');
    expect(hard.name).toBe('hard');
  });
});

describe('difficulty scaling', () => {
  it('should have increasing goal successes with difficulty', () => {
    expect(EASY.goalNumberOfSuccesses).toBeLessThan(MEDIUM.goalNumberOfSuccesses);
    expect(MEDIUM.goalNumberOfSuccesses).toBeLessThan(HARD.goalNumberOfSuccesses);
  });

  it('should have increasing game timers with difficulty', () => {
    expect(EASY.initialGameTimer).toBeLessThan(MEDIUM.initialGameTimer);
    expect(MEDIUM.initialGameTimer).toBeLessThan(HARD.initialGameTimer);
  });

  it('should have increasing points with difficulty', () => {
    expect(EASY.points).toBeLessThan(MEDIUM.points);
    expect(MEDIUM.points).toBeLessThan(HARD.points);
  });

  it('should have same feed timer across all difficulties', () => {
    expect(EASY.initialFeedTimer).toBe(MEDIUM.initialFeedTimer);
    expect(MEDIUM.initialFeedTimer).toBe(HARD.initialFeedTimer);
  });
});

describe('DifficultyConfig interface', () => {
  it('should only allow valid difficulty names', () => {
    // This is a compile-time check, but we can verify runtime behavior
    const validNames: DifficultyConfig['name'][] = ['easy', 'medium', 'hard'];
    expect(validNames).toContain(EASY.name);
    expect(validNames).toContain(MEDIUM.name);
    expect(validNames).toContain(HARD.name);
  });
});
