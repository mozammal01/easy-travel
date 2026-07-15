import { Router } from 'express';
import { createTripInputSchema } from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { generateTripItinerary } from '../services/trip.service';
import { toTripDto } from '../lib/dto';

export const tripsRouter = Router();

tripsRouter.post(
  '/',
  requireAuth,
  validateBody(createTripInputSchema),
  asyncHandler(async (req, res) => {
    const trip = await generateTripItinerary(req.userId!, req.body);
    res.status(201).json({ trip: toTripDto(trip) });
  }),
);
