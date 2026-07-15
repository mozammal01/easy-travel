import { Router } from 'express';
import { createTripInputSchema, updateItineraryItemInputSchema } from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import {
  generateTripItinerary,
  getTripForUser,
  updateItineraryItem,
} from '../services/trip.service';
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

tripsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trip = await getTripForUser(req.userId!, req.params.id);
    res.json({ trip: toTripDto(trip) });
  }),
);

tripsRouter.patch(
  '/:id/items/:itemId',
  requireAuth,
  validateBody(updateItineraryItemInputSchema),
  asyncHandler(async (req, res) => {
    const trip = await updateItineraryItem(
      req.userId!,
      req.params.id,
      req.params.itemId,
      req.body,
    );
    res.json({ trip: toTripDto(trip) });
  }),
);
