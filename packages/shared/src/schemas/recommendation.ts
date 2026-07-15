import { z } from 'zod';

export const recommendationRequestSchema = z.object({
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
  region: z.string().min(1).optional(),
  budgetLevel: z.enum(['budget', 'mid-range', 'luxury']).optional(),
  durationDays: z.coerce.number().int().positive().max(90).optional(),
});
export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;

export const destinationRecommendationSchema = z.object({
  destination: z.string().min(1),
  country: z.string().min(1),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  budgetLevel: z.enum(['budget', 'mid-range', 'luxury']),
  bestSeason: z.string().min(1),
  tags: z.array(z.string()),
});
export type DestinationRecommendation = z.infer<typeof destinationRecommendationSchema>;

export const recommendationResponseSchema = z.object({
  recommendations: z.array(destinationRecommendationSchema).min(5),
});
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
