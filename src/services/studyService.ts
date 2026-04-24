import prisma from '../db/prisma';
import { calculateSM2, DEFAULT_SM2_STATE } from './sm2';
import { computeScore } from './scoring';
import type { ReviewDTO } from '../schemas/studySchema';

const NEW_CARDS_PER_SESSION = 10;
const REVIEW_CARDS_PER_SESSION = 20;

type TagRetention = { tag: string; totalReviews: number; retentionRate: number; avgEaseFactor: number };
type StreakRow = { streakDays: number };
type RateRow = { rate: number };

class StudyService {
  async getSession(deckId: string, userId: string) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw { status: 404, message: 'Deck not found' };
    if (!deck.isPublic && deck.userId !== userId) throw { status: 403, message: 'Forbidden' };

    const progressEntries = await prisma.cardProgress.findMany({
      where: { userId, card: { deckId } },
      select: { cardId: true, nextReviewAt: true },
    });

    type ProgressEntry = { cardId: string; nextReviewAt: Date };

    const seenCardIds = new Set(progressEntries.map((p: ProgressEntry) => p.cardId));

    const newCards = await prisma.card.findMany({
      where: { deckId, id: { notIn: Array.from(seenCardIds) } },
      include: { tags: { select: { tag: true } } },
      take: NEW_CARDS_PER_SESSION,
    });

    const dueCardIds = progressEntries
      .filter((p: ProgressEntry) => p.nextReviewAt <= new Date())
      .map((p: ProgressEntry) => p.cardId);

    const dueCards = await prisma.card.findMany({
      where: { id: { in: dueCardIds } },
      include: { tags: { select: { tag: true } } },
      take: REVIEW_CARDS_PER_SESSION,
    });

    return {
      deckTitle: deck.title,
      newCards,
      dueCards,
      totals: { new: newCards.length, due: dueCards.length, total: newCards.length + dueCards.length },
    };
  }

  async submitReview(cardId: string, dto: ReviewDTO, userId: string) {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw { status: 404, message: 'Card not found' };

    const { quality, isCorrect, similarityRatio } = computeScore({
      exerciseType:  dto.exerciseType,
      userAnswer:    dto.userAnswer,
      correctAnswer: card.back,
      timeSpentMs:   dto.timeSpentMs,
      attempts:      dto.attempts,
    });

    const currentProgress = await prisma.cardProgress.findUnique({
      where: { cardId_userId: { cardId, userId } },
    });

    const sm2Input = currentProgress
      ? { easeFactor: currentProgress.easeFactor, interval: currentProgress.interval, repetitions: currentProgress.repetitions }
      : DEFAULT_SM2_STATE;

    const sm2Result = calculateSM2(quality, sm2Input);

    const [progress] = await prisma.$transaction([
      prisma.cardProgress.upsert({
        where: { cardId_userId: { cardId, userId } },
        create: {
          cardId,
          userId,
          easeFactor:   sm2Result.easeFactor,
          interval:     sm2Result.interval,
          repetitions:  sm2Result.repetitions,
          nextReviewAt: sm2Result.nextReviewAt,
        },
        update: {
          easeFactor:   sm2Result.easeFactor,
          interval:     sm2Result.interval,
          repetitions:  sm2Result.repetitions,
          nextReviewAt: sm2Result.nextReviewAt,
        },
      }),
      prisma.cardReview.create({
        data: {
          cardId,
          userId,
          quality,
          exerciseType: dto.exerciseType,
          userAnswer:   dto.userAnswer,
          isCorrect,
          timeSpentMs:  dto.timeSpentMs,
        },
      }),
    ]);

    return {
      isCorrect,
      quality,
      similarityRatio,
      nextReviewAt: progress.nextReviewAt,
      intervalDays: sm2Result.interval,
      easeFactor:   sm2Result.easeFactor,
    };
  }

  async getStats(userId: string) {
    const [totalDecks, totalCards, totalReviews] = await Promise.all([
      prisma.deck.count({ where: { userId } }),
      prisma.cardProgress.count({ where: { userId } }),
      prisma.cardReview.count({ where: { userId } }),
    ]);

    const retentionByTag = await prisma.$queryRaw<TagRetention[]>`
      SELECT
        ct.tag,
        CAST(COUNT(*) AS INTEGER) AS totalReviews,
        ROUND(AVG(CASE WHEN cr.isCorrect = 1 THEN 1.0 ELSE 0.0 END) * 100, 1) AS retentionRate,
        ROUND(AVG(cp.easeFactor), 3) AS avgEaseFactor
      FROM CardReview   cr
      JOIN CardTag      ct ON ct.cardId = cr.cardId
      JOIN CardProgress cp ON cp.cardId = cr.cardId AND cp.userId = cr.userId
      WHERE cr.userId = ${userId}
      GROUP BY ct.tag
      ORDER BY retentionRate DESC
    `;

    const streakRows = await prisma.$queryRaw<StreakRow[]>`
      WITH daily AS (
        SELECT DISTINCT SUBSTR(reviewedAt, 1, 10) AS studyDay
        FROM CardReview
        WHERE userId = ${userId}
      ),
      grouped AS (
        SELECT
          studyDay,
          JULIANDAY(studyDay) - ROW_NUMBER() OVER (ORDER BY studyDay) AS grp
        FROM daily
      ),
      streaks AS (
        SELECT
          CAST(COUNT(*) AS INTEGER) AS streakDays,
          MAX(studyDay) AS lastDay
        FROM grouped
        GROUP BY grp
      )
      SELECT streakDays
      FROM streaks
      ORDER BY lastDay DESC
      LIMIT 1
    `;

    const overallRows = await prisma.$queryRaw<RateRow[]>`
      SELECT ROUND(AVG(CASE WHEN isCorrect = 1 THEN 1.0 ELSE 0.0 END) * 100, 1) AS rate
      FROM CardReview
      WHERE userId = ${userId}
    `;

    return {
      totalDecks,
      totalCards,
      totalReviews,
      currentStreak:   Number(streakRows[0]?.streakDays ?? 0),
      overallRetention: overallRows[0]?.rate ?? 0,
      retentionByTag:  retentionByTag.map((r) => ({ ...r, totalReviews: Number(r.totalReviews) })),
    };
  }

  async getHeatmap(userId: string) {
    // Фільтруємо через Prisma (надійно на будь-якій ОС),
    // групуємо по даті в JS (уникаємо SQLite date quirks на Windows)
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const reviews = await prisma.cardReview.findMany({
      where: { userId, reviewedAt: { gte: since } },
      select: { reviewedAt: true },
      orderBy: { reviewedAt: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const review of reviews) {
      const date = review.reviewedAt.toISOString().slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  async getForecast(userId: string) {
    // Prisma + JS grouping — уникаємо SQLite BETWEEN quirks (аналогічно getHeatmap)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    const progresses = await prisma.cardProgress.findMany({
      where: {
        userId,
        nextReviewAt: { gte: now, lte: in30Days },
      },
      select: { nextReviewAt: true },
      orderBy: { nextReviewAt: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const p of progresses) {
      const date = p.nextReviewAt.toISOString().slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}

export const studyService = new StudyService();