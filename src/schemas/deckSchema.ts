import * as z from 'zod';

export const createDeckSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(100, { message: 'Title must not exceed 100 characters' }),
  description: z
    .string()
    .max(500, { message: 'Description must not exceed 500 characters' })
    .optional(),
  isPublic: z.boolean().optional().default(false),
});

export const updateDeckSchema = createDeckSchema.partial();

export type CreateDeckDTO = z.infer<typeof createDeckSchema>;
export type UpdateDeckDTO = z.infer<typeof updateDeckSchema>;
