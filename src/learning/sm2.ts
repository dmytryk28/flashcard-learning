export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result extends SM2State {
  nextReviewAt: Date;
  quality: number;
}

export const DEFAULT_SM2_STATE: SM2State = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

/**
 * SuperMemo 2
 */
export function calculateSM2(quality: number, state: SM2State): SM2Result {
  if (quality < 0 || quality > 5) {
    throw { status: 400, message: 'Quality must be between 0 and 5' };
  }

  let { easeFactor, interval, repetitions } = state;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  easeFactor = Math.round(easeFactor * 1000) / 1000;

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);
  nextReviewAt.setHours(0, 0, 0, 0);

  return { easeFactor, interval, repetitions, nextReviewAt, quality };
}
