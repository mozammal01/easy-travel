import { Router } from 'express';
import { createDestinationInputSchema, updateDestinationInputSchema } from '@meghjatra/shared';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { asyncHandler } from '../lib/asyncHandler';
import {
  createDestination,
  deleteDestination,
  getDestinationById,
  listDestinations,
  updateDestination,
} from '../services/destination.service';

export const destinationsRouter = Router();

destinationsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const destinations = await listDestinations();
    res.json({ destinations });
  }),
);

destinationsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const destination = await getDestinationById(req.params.id);
    res.json({ destination });
  }),
);

destinationsRouter.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validateBody(createDestinationInputSchema),
  asyncHandler(async (req, res) => {
    const destination = await createDestination(req.body);
    res.status(201).json({ destination });
  }),
);

destinationsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validateBody(updateDestinationInputSchema),
  asyncHandler(async (req, res) => {
    const destination = await updateDestination(req.params.id, req.body);
    res.json({ destination });
  }),
);

destinationsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await deleteDestination(req.params.id);
    res.status(204).send();
  }),
);
