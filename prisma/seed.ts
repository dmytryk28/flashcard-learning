import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@flashcard.dev' },
    update: {},
    create: { email: 'demo@flashcard.dev', password, name: 'Demo User' },
  });

  const jsDeck = await prisma.deck.create({
    data: {
      title: 'JavaScript Fundamentals',
      description: 'Core JS concepts every developer must know',
      isPublic: true,
      userId: user.id,
      cards: {
        create: [
          {
            front: 'What is a closure in JavaScript?',
            back: 'A closure is a function that retains access to its outer scope variables even after the outer function has returned.',
            hint: 'Think about inner functions and lexical scope',
            tags: { create: [{ tag: 'functions' }, { tag: 'scope' }] },
          },
          {
            front: 'What is the difference between == and ===?',
            back: '== performs type coercion before comparison. === compares both value and type without coercion.',
            hint: 'Consider: 0 == false vs 0 === false',
            tags: { create: [{ tag: 'operators' }, { tag: 'types' }] },
          },
          {
            front: 'What is event delegation?',
            back: 'Attaching a single event listener to a parent element to handle events from its children, leveraging event bubbling.',
            hint: 'Think about DOM event bubbling',
            tags: { create: [{ tag: 'dom' }, { tag: 'events' }] },
          },
          {
            front: 'What is the difference between let, const, and var?',
            back: 'var is function-scoped and hoisted. let is block-scoped. const is block-scoped and cannot be reassigned.',
            tags: { create: [{ tag: 'variables' }, { tag: 'scope' }] },
          },
          {
            front: 'What is a Promise?',
            back: 'An object representing the eventual completion or failure of an async operation, with states: pending, fulfilled, or rejected.',
            tags: { create: [{ tag: 'async' }, { tag: 'promises' }] },
          },
          {
            front: 'What is the event loop?',
            back: 'A mechanism that allows JavaScript to perform non-blocking operations by offloading operations to the system kernel whenever possible.',
            tags: { create: [{ tag: 'async' }, { tag: 'runtime' }] },
          },
          {
            front: 'What is prototype chain?',
            back: 'A series of links between objects where each object has a reference to its prototype, used for property and method inheritance.',
            tags: { create: [{ tag: 'oop' }, { tag: 'prototype' }] },
          },
          {
            front: 'What does Array.prototype.reduce do?',
            back: 'Executes a reducer function on each element of the array, resulting in a single output value.',
            tags: { create: [{ tag: 'arrays' }, { tag: 'functions' }] },
          },
        ],
      },
    },
    include: { cards: true },
  });

  const tsDeck = await prisma.deck.create({
    data: {
      title: 'TypeScript Basics',
      description: 'TypeScript type system and features',
      isPublic: true,
      userId: user.id,
      cards: {
        create: [
          {
            front: 'What is the difference between interface and type in TypeScript?',
            back: 'Interfaces are extendable and support declaration merging. Types are more flexible and support unions, intersections, and mapped types.',
            tags: { create: [{ tag: 'typescript' }, { tag: 'types' }] },
          },
          {
            front: 'What is a generic in TypeScript?',
            back: 'A way to create reusable components that work with a variety of types while still maintaining type safety.',
            tags: { create: [{ tag: 'typescript' }, { tag: 'generics' }] },
          },
          {
            front: 'What is the "unknown" type?',
            back: 'A type-safe alternative to "any". You must narrow the type before performing operations on an unknown value.',
            tags: { create: [{ tag: 'typescript' }, { tag: 'types' }] },
          },
          {
            front: 'What is a union type?',
            back: 'A type formed from two or more other types, representing values that may be any one of those types.',
            tags: { create: [{ tag: 'typescript' }, { tag: 'types' }] },
          },
          {
            front: 'What are decorators in TypeScript?',
            back: 'Special declarations attached to class declarations, methods, or properties that can modify behavior at runtime.',
            tags: { create: [{ tag: 'typescript' }, { tag: 'advanced' }] },
          },
        ],
      },
    },
    include: { cards: true },
  });

  await prisma.deck.create({
    data: {
      title: 'SQL Essentials',
      description: 'Core SQL concepts and query patterns',
      isPublic: false,
      userId: user.id,
      cards: {
        create: [
          {
            front: 'What is a LEFT JOIN?',
            back: 'Returns all rows from the left table and matched rows from the right table. Unmatched right-side rows are NULL.',
            tags: { create: [{ tag: 'sql' }, { tag: 'joins' }] },
          },
          {
            front: 'What is a window function?',
            back: 'A function that performs a calculation across a set of table rows related to the current row, without collapsing them into a single output row.',
            tags: { create: [{ tag: 'sql' }, { tag: 'advanced' }] },
          },
          {
            front: 'What is a CTE?',
            back: 'Common Table Expression — a temporary named result set defined within a WITH clause that can be referenced within the main query.',
            tags: { create: [{ tag: 'sql' }, { tag: 'advanced' }] },
          },
        ],
      },
    },
  });

  const allCards = [...jsDeck.cards, ...tsDeck.cards];

  const studyDays = [
    -60, -59, -58, -56, -55, -54, -53, -52, -51,
    -49, -48, -47, -46, -45, -43, -42, -41, -40,
    -38, -37, -36, -35, -34, -32, -31, -30, -29,
    -27, -26, -25, -24, -23, -22, -21, -20, -19,
    -17, -16, -15, -14, -13, -12, -11, -10, -9,
    -7, -6, -5, -4, -3, -2, -1,
  ];

  const exerciseTypes: Array<'typing' | 'choice' | 'matching'> = ['typing', 'choice', 'matching'];

  for (const dayOffset of studyDays) {
    const reviewDate = daysFromNow(dayOffset);
    reviewDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);

    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    const cardsToReview = shuffled.slice(0, 3 + Math.floor(Math.random() * 4));

    for (const card of cardsToReview) {
      const quality = 2 + Math.floor(Math.random() * 4);
      const isCorrect = quality >= 3;
      const exerciseType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];

      await prisma.cardReview.create({
        data: {
          cardId: card.id,
          userId: user.id,
          quality,
          exerciseType,
          userAnswer: isCorrect ? card.back.slice(0, 30) : 'wrong answer',
          isCorrect,
          timeSpentMs: 2000 + Math.floor(Math.random() * 8000),
          reviewedAt: reviewDate,
        },
      });
    }
  }

  const totalCards = allCards.length;
  for (let i = 0; i < totalCards; i++) {
    const card = allCards[i];

    const dayOffset = 1 + Math.floor((i / totalCards) * 29);
    const nextReviewAt = daysFromNow(dayOffset);
    nextReviewAt.setHours(0, 0, 0, 0);

    await prisma.cardProgress.upsert({
      where: { cardId_userId: { cardId: card.id, userId: user.id } },
      create: {
        cardId: card.id,
        userId: user.id,
        easeFactor: 2.1 + Math.random() * 0.8,
        interval: dayOffset,
        repetitions: 3 + Math.floor(Math.random() * 10),
        nextReviewAt,
      },
      update: {
        nextReviewAt,
        interval: dayOffset,
      },
    });
  }

  console.log(`Demo user: demo@flashcard.dev / password123`);
  console.log(`3 decks, ${allCards.length} cards`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
