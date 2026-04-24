import * as z from 'zod';

export const createCardSchema = z.object({
  front: z
    .string()
    .min(1, { message: 'Front is required' })
    .max(1000, { message: 'Front must not exceed 1000 characters' }),
  back: z
    .string()
    .min(1, { message: 'Back is required' })
    .max(1000, { message: 'Back must not exceed 1000 characters' }),
  hint: z
    .string()
    .max(500, { message: 'Hint must not exceed 500 characters' })
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, { message: 'Cannot add more than 10 tags' })
    .optional()
    .default([]),
});

export const updateCardSchema = createCardSchema.partial();

export type CreateCardDTO = z.infer<typeof createCardSchema>;
export type UpdateCardDTO = z.infer<typeof updateCardSchema>;
