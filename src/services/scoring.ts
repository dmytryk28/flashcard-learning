export type ExerciseType = 'typing' | 'choice' | 'matching';

export interface ScoringInput {
  exerciseType: ExerciseType;
  userAnswer: string;
  correctAnswer: string;
  timeSpentMs?: number;
  attempts?: number;
}

export interface ScoringResult {
  quality: number;
  isCorrect: boolean;
  similarityRatio?: number;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  if (na === nb) return 1;
  const max = Math.max(na.length, nb.length);
  return max === 0 ? 1 : 1 - levenshtein(na, nb) / max;
}

export function computeScore(input: ScoringInput): ScoringResult {
  const { exerciseType, userAnswer, correctAnswer, timeSpentMs = 0, attempts = 1 } = input;

  switch (exerciseType) {
    case 'typing': {
      const ratio = similarity(userAnswer, correctAnswer);
      if (ratio >= 0.95) return { quality: timeSpentMs < 5000 ? 5 : 4, isCorrect: true, similarityRatio: ratio };
      if (ratio >= 0.75) return { quality: 3, isCorrect: true, similarityRatio: ratio };
      if (ratio >= 0.4)  return { quality: 2, isCorrect: false, similarityRatio: ratio };
      return { quality: 1, isCorrect: false, similarityRatio: ratio };
    }

    case 'choice': {
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      if (!isCorrect) return { quality: 1, isCorrect: false };
      if (timeSpentMs < 3000) return { quality: 5, isCorrect: true };
      if (timeSpentMs < 8000) return { quality: 4, isCorrect: true };
      return { quality: 3, isCorrect: true };
    }

    case 'matching': {
      if (attempts === 1) return { quality: 5, isCorrect: true };
      if (attempts === 2) return { quality: 3, isCorrect: true };
      return { quality: 1, isCorrect: false };
    }

    default:
      return { quality: 0, isCorrect: false };
  }
}
