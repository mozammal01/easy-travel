import { Router } from 'express';
import {
  createReviewInputSchema,
  listReviewsQuerySchema,
  updateReviewInputSchema,
  type ListReviewsQuery,
} from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import {
  createReview,
  deleteReview,
  flagReview,
  listReviews,
  updateReview,
} from '../services/review.service';
import { toReviewDto } from '../lib/dto';

export const reviewsRouter = Router();

reviewsRouter.get(
  '/',
  validateQuery(listReviewsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListReviewsQuery;
    const reviews = await listReviews(query);
    res.json({ reviews: reviews.map(toReviewDto) });
  }),
);

reviewsRouter.post(
  '/',
  requireAuth,
  validateBody(createReviewInputSchema),
  asyncHandler(async (req, res) => {
    const review = await createReview(req.userId!, req.body);
    res.status(201).json({ review: toReviewDto(review) });
  }),
);

reviewsRouter.patch(
  '/:id',
  requireAuth,
  validateBody(updateReviewInputSchema),
  asyncHandler(async (req, res) => {
    const review = await updateReview(req.userId!, req.params.id, req.body);
    res.json({ review: toReviewDto(review) });
  }),
);

reviewsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await deleteReview(req.userId!, req.params.id);
    res.status(204).send();
  }),
);

reviewsRouter.post(
  '/:id/flag',
  requireAuth,
  asyncHandler(async (req, res) => {
    const review = await flagReview(req.userId!, req.params.id);
    res.json({ review: toReviewDto(review) });
  }),
);
