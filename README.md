# Flashcard Learning API

A REST API for spaced-repetition flashcard learning. Users create decks of cards, study them through typed or multiple-choice exercises, and the system schedules future reviews using the SuperMemo 2 (SM-2) algorithm. Progress, streaks, retention rates, and upcoming review forecasts are tracked per user.

---

## Tech Stack

| Layer | Technology                |
|---|---------------------------|
| Runtime | Node.js                   |
| Language | TypeScript                |
| Framework | Express                   |
| ORM | Prisma                    |
| Database | SQLite + Prisma |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod                       |

---

## Data Model

### User
Stores credentials and profile. Owns decks, card progress records, review history, and refresh tokens.

### Deck
A named collection of cards. Can be private (owner only) or public (visible and cloneable by other users). Deleting a deck cascades to all its cards.

### Card
Belongs to one deck. Has a `front` (question/term), a `back` (correct answer), an optional `hint`, and zero or more `CardTag` records.

### CardTag
A tag string attached to a card. Used to group retention statistics.

### CardProgress
One record per (card, user) pair. Stores the current SM-2 state: `easeFactor`, `interval` (days), `repetitions`, and `nextReviewAt`. Upserted after every review.

### CardReview
An append-only log of every review attempt. Records the exercise type, the user's answer, whether it was correct, the computed quality score, and time spent.

### RefreshToken
Stores issued refresh tokens with expiry. Deleted on logout or expiry.

---

## Scoring and SM-2

### Quality Score (0-5)

Each review produces a quality score fed into SM-2. The score depends on the exercise type:

**Typing** — the user's answer is compared to the correct answer using Levenshtein-based similarity.

**Choice** — the user selects one of four options.

**Matching** — the user pairs items (number of attempts matters).

### SM-2 Algorithm

Given a quality score `q` and the card's current state (`easeFactor`, `interval`, `repetitions`):

- If `q >= 3` (correct): increment repetitions, compute next interval (1 day, then 6 days, then `interval * easeFactor` rounded).
- If `q < 3` (incorrect): reset repetitions to 0, set interval to 1.
- Update `easeFactor`:
  `EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`
  Minimum EF is 1.3.
- `nextReviewAt` is set to midnight of the day that is `interval` days from now.
