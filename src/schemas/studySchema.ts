import * as z from 'zod';

export const reviewSchema = z.object({
  exerciseType: z.enum(['typing', 'choice', 'matching'], {
    message: 'exerciseType must be typing, choice, or matching',
  }),
  userAnswer: z.string().min(1, { message: 'userAnswer is required' }),
  timeSpentMs: z
    .number()
    .int()
    .nonnegative({ message: 'timeSpentMs must be a non-negative integer' })
    .optional(),
  attempts: z
    .number()
    .int()
    .min(1, { message: 'attempts must be at least 1' })
    .optional()
    .default(1),
});

export type ReviewDTO = z.infer<typeof reviewSchema>;
