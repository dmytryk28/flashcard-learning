import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@flashcard.dev' },
    update: {},
    create: { email: 'demo@flashcard.dev', password, name: 'Demo User' },
  });

  const deck = await prisma.deck.create({
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
        ],
      },
    },
  });

  console.log(`User: ${user.email} / password123`);
  console.log(`Deck: "${deck.title}" (public, 5 cards)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
