import { Router } from 'express';
import { recommendationRequestSchema, type RecommendationRequest } from '@meghjatra/shared';
import { validateQuery } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { getDestinationRecommendations } from '../services/recommendation.service';

export const recommendationsRouter = Router();

recommendationsRouter.get(
  '/',
  validateQuery(recommendationRequestSchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as RecommendationRequest;
    const recommendations = await getDestinationRecommendations(query);
    res.json({ recommendations });
  }),
);
