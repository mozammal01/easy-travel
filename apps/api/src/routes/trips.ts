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
  ensureShareToken,
  generateTripItinerary,
  getTripByShareToken,
  getTripForUser,
  listTrips,
  pinAccommodation,
  removeItineraryItem,
  revokeShareToken,
  softDeleteTrip,
  updateItineraryItem,
} from '../services/trip.service';
import { generateTripPdf } from '../services/tripExport.service';
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
  '/shared/:token',
  asyncHandler(async (req, res) => {
    const trip = await getTripByShareToken(req.params.token);
    res.json({ trip: toTripDto(trip) });
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
  '/:id/share',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trip = await ensureShareToken(req.userId!, req.params.id);
    res.json({ trip: toTripDto(trip) });
  }),
);

tripsRouter.delete(
  '/:id/share',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trip = await revokeShareToken(req.userId!, req.params.id);
    res.json({ trip: toTripDto(trip) });
  }),
);

tripsRouter.get(
  '/:id/export/pdf',
  requireAuth,
  asyncHandler(async (req, res) => {
    const trip = await getTripForUser(req.userId!, req.params.id);
    const tripDto = toTripDto(trip);
    const pdfBytes = await generateTripPdf(tripDto);
    const filename = `${tripDto.destination.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-itinerary.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
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
