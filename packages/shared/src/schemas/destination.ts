import { z } from 'zod';

export const destinationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  country: z.string(),
  region: z.string().nullable(),
  description: z.string().nullable(),
  heroImageUrl: z.string().nullable(),
  galleryImageUrls: z.array(z.string()),
  budgetLevel: z.string().nullable(),
  bestSeason: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type DestinationDto = z.infer<typeof destinationSchema>;

export const createDestinationInputSchema = z.object({
  name: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  region: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  heroImageUrl: z.string().url().optional(),
  galleryImageUrls: z.array(z.string().url()).optional(),
  budgetLevel: z.enum(['budget', 'mid-range', 'luxury']).optional(),
  bestSeason: z.string().max(120).optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateDestinationInput = z.infer<typeof createDestinationInputSchema>;

export const updateDestinationInputSchema = createDestinationInputSchema.partial();
export type UpdateDestinationInput = z.infer<typeof updateDestinationInputSchema>;
