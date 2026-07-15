import { z } from 'zod';

export const discoveryCategorySchema = z.enum(['food', 'attraction']);
export type DiscoveryCategory = z.infer<typeof discoveryCategorySchema>;

export const discoveryPriceLevelSchema = z.enum(['$', '$$', '$$$', '$$$$']);
export type DiscoveryPriceLevel = z.infer<typeof discoveryPriceLevelSchema>;

export const discoveryRequestSchema = z.object({
  destination: z.string().min(1),
  category: discoveryCategorySchema.optional(),
  interests: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  budgetLevel: z.enum(['budget', 'mid-range', 'luxury']).optional(),
});
export type DiscoveryRequest = z.infer<typeof discoveryRequestSchema>;

export const discoveryItemSchema = z.object({
  name: z.string().min(1),
  category: discoveryCategorySchema,
  description: z.string().min(1),
  rating: z.number().min(0).max(5),
  priceLevel: discoveryPriceLevelSchema,
  tags: z.array(z.string()),
  imageUrl: z.string().url(),
});
export type DiscoveryItemDto = z.infer<typeof discoveryItemSchema>;

export const discoveryResponseSchema = z.object({
  items: z.array(discoveryItemSchema).min(6),
});
export type DiscoveryResponse = z.infer<typeof discoveryResponseSchema>;
