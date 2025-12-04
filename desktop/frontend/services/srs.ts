import { Flashcard } from "../types";

// Ratings provided by the user
export enum Grade {
  AGAIN = 0, // Forgot completely (reset)
  HARD = 1,  // Remembered with difficulty
  GOOD = 2,  // Remembered perfectly
  EASY = 3,  // Remembered easily
}

// Initial state for a new card
export const createInitialSRSState = () => ({
  interval: 0,
  repetition: 0,
  efactor: 2.5,
  nextReview: Date.now(), // Due immediately
  lastUpdated: Date.now()
});

/**
 * SuperMemo-2 Algorithm implementation
 * Calculates the next review schedule based on user grade.
 */
export const calculateNextReview = (card: Flashcard, grade: Grade): Flashcard => {
  let { interval, repetition, efactor } = card;
  
  // 1. Update Easiness Factor (EF)
  let quality = 0;
  if (grade === Grade.HARD) quality = 3;
  if (grade === Grade.GOOD) quality = 4;
  if (grade === Grade.EASY) quality = 5;

  if (grade !== Grade.AGAIN) {
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;
  }

  // 2. Update Repetition and Interval
  if (grade === Grade.AGAIN) {
    repetition = 0;
    interval = 0;
  } else {
    repetition += 1;
    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * efactor);
    }
  }

  // 3. Calculate Next Review Date
  const now = Date.now();
  let nextReview = now;

  if (grade === Grade.AGAIN) {
    nextReview = now; 
  } else {
    nextReview = now + (interval * 24 * 60 * 60 * 1000);
  }

  return {
    ...card,
    interval,
    repetition,
    efactor,
    nextReview,
    lastUpdated: now // Mark as modified for sync
  };
};

export const getNextReviewText = (currentInterval: number, grade: Grade, currentEfactor: number): string => {
  if (grade === Grade.AGAIN) return '< 1m';
  
  let nextInt = 0;
  if (currentInterval === 0) nextInt = 1;
  else if (currentInterval === 1) nextInt = 6;
  else nextInt = Math.round(currentInterval * currentEfactor);
  
  if (grade === Grade.HARD) nextInt = Math.max(1, Math.floor(nextInt * 0.8)); 
  if (grade === Grade.EASY) nextInt = Math.floor(nextInt * 1.3);

  return `${nextInt}d`;
};