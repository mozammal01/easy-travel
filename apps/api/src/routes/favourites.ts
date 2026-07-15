import { Router } from 'express';
import {
  createFavouriteInputSchema,
  removeFavouriteQuerySchema,
  type RemoveFavouriteQuery,
} from '@meghjatra/shared';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../lib/asyncHandler';
import { addFavourite, listFavourites, removeFavourite } from '../services/favourite.service';
import { toFavouriteDto } from '../lib/dto';

export const favouritesRouter = Router();

favouritesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const favourites = await listFavourites(req.userId!);
    res.json({ favourites: favourites.map(toFavouriteDto) });
  }),
);

favouritesRouter.post(
  '/',
  requireAuth,
  validateBody(createFavouriteInputSchema),
  asyncHandler(async (req, res) => {
    const favourite = await addFavourite(req.userId!, req.body);
    res.status(201).json({ favourite: toFavouriteDto(favourite) });
  }),
);

favouritesRouter.delete(
  '/',
  requireAuth,
  validateQuery(removeFavouriteQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as RemoveFavouriteQuery;
    await removeFavourite(req.userId!, query.itemType, query.itemRef);
    res.status(204).send();
  }),
);
