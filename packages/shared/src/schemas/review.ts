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

export const updateReviewInputSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    text: z.string().min(20).max(500).optional(),
  })
  .refine((data) => data.rating !== undefined || data.text !== undefined, {
    message: 'At least one of rating or text must be provided',
  });
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;

export const reviewSortSchema = z.enum(['recent', 'rating', 'helpful']);
export type ReviewSort = z.infer<typeof reviewSortSchema>;

export const listReviewsQuerySchema = z.object({
  destination: z.string().min(1),
  sort: reviewSortSchema.optional(),
});
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
