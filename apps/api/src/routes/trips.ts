import { Router } from 'express';
import {
  accommodationSchema,
  createItineraryItemInputSchema,
  createTripInputSchema,
  updateItineraryItemInputSchema,
} from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import {
  addItineraryItem,
  calculateTripBudget,
  duplicateTrip,
  generateTripItinerary,
  getTripForUser,
  listTrips,
  pinAccommodation,
  removeItineraryItem,
  softDeleteTrip,
  updateItineraryItem,
} from '../services/trip.service';
import { toTripDto } from '../lib/dto';

export const tripsRouter = Router();

tripsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trips = await listTrips(req.userId!);
    res.json({ trips: trips.map(toTripDto) });
  }),
);

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

tripsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await softDeleteTrip(req.userId!, req.params.id);
    res.status(204).send();
  }),
);

tripsRouter.get(
  '/:id/budget',
  requireAuth,
  asyncHandler(async (req, res) => {
    const budget = await calculateTripBudget(req.userId!, req.params.id);
    res.json({ budget });
  }),
);

tripsRouter.post(
  '/:id/accommodation',
  requireAuth,
  validateBody(accommodationSchema),
  asyncHandler(async (req, res) => {
    const trip = await pinAccommodation(req.userId!, req.params.id, req.body);
    res.json({ trip: toTripDto(trip) });
  }),
);

tripsRouter.post(
  '/:id/duplicate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trip = await duplicateTrip(req.userId!, req.params.id);
    res.status(201).json({ trip: toTripDto(trip) });
  }),
);

tripsRouter.post(
  '/:id/items',
  requireAuth,
  validateBody(createItineraryItemInputSchema),
  asyncHandler(async (req, res) => {
    const trip = await addItineraryItem(req.userId!, req.params.id, req.body);
    res.status(201).json({ trip: toTripDto(trip) });
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

tripsRouter.delete(
  '/:id/items/:itemId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trip = await removeItineraryItem(req.userId!, req.params.id, req.params.itemId);
    res.json({ trip: toTripDto(trip) });
  }),
);
