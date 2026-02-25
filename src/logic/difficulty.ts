export interface DifficultyConfig {
  name: 'easy' | 'medium' | 'hard';
  goalNumberOfSuccesses: number;
  initialFeedTimer: number; // in seconds
  initialGameTimer: number; // in seconds
  points: number;
}

export const EASY: DifficultyConfig = {
  name: 'easy',
  goalNumberOfSuccesses: 3,
  initialFeedTimer: 120, // 2 minutes
  initialGameTimer: 300, // 5 minutes
  points: 1,
};

export const MEDIUM: DifficultyConfig = {
  name: 'medium',
  goalNumberOfSuccesses: 5,
  initialFeedTimer: 120, // 2 minutes
  initialGameTimer: 360, // 6 minutes
  points: 3,
};

export const HARD: DifficultyConfig = {
  name: 'hard',
  goalNumberOfSuccesses: 7,
  initialFeedTimer: 120, // 2 minutes
  initialGameTimer: 420, // 7 minutes
  points: 8,
};

export const DIFFICULTIES = [EASY, MEDIUM, HARD] as const;
