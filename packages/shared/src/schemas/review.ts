import { z } from 'zod';

export const reviewSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  destination: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20).max(500),
  helpfulCount: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  editableUntil: z.coerce.date(),
  flagged: z.boolean(),
});
export type ReviewDto = z.infer<typeof reviewSchema>;

export const createReviewInputSchema = z.object({
  destination: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20).max(500),
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
