import { Router } from 'express';
import { accommodationRequestSchema, type AccommodationRequest } from '@meghjatra/shared';
import { validateQuery } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { getAccommodationRecommendations } from '../services/accommodation.service';

export const accommodationsRouter = Router();

accommodationsRouter.get(
  '/',
  validateQuery(accommodationRequestSchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as AccommodationRequest;
    const accommodations = await getAccommodationRecommendations(query);
    res.json({ accommodations });
  }),
);
