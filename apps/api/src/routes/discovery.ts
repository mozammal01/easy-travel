import { Router } from 'express';
import { discoveryRequestSchema, type DiscoveryRequest } from '@meghjatra/shared';
import { validateQuery } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { getDiscoveryItems } from '../services/discovery.service';

export const discoveryRouter = Router();

discoveryRouter.get(
  '/',
  validateQuery(discoveryRequestSchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as DiscoveryRequest;
    const items = await getDiscoveryItems(query);
    res.json({ items });
  }),
);
