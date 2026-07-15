import { z } from 'zod';

export const favouriteItemTypeSchema = z.enum(['destination', 'food', 'attraction', 'accommodation']);
export type FavouriteItemType = z.infer<typeof favouriteItemTypeSchema>;

export const favouriteSchema = z.object({
  id: z.string().uuid(),
  itemType: favouriteItemTypeSchema,
  itemRef: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.coerce.date(),
});
export type FavouriteDto = z.infer<typeof favouriteSchema>;

export const createFavouriteInputSchema = z.object({
  itemType: favouriteItemTypeSchema,
  itemRef: z.string().min(1).max(200),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CreateFavouriteInput = z.infer<typeof createFavouriteInputSchema>;

export const removeFavouriteQuerySchema = z.object({
  itemType: favouriteItemTypeSchema,
  itemRef: z.string().min(1).max(200),
});
export type RemoveFavouriteQuery = z.infer<typeof removeFavouriteQuerySchema>;
